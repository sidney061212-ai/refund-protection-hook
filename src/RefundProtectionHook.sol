// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20Minimal} from "./IERC20Minimal.sol";
import {RefundInsuranceVault} from "./RefundInsuranceVault.sol";

/// @notice MVP core for a Uniswap v4 Refund Protection Hook.
/// @dev This contract contains the actual insurance/refund state machine.
///      The adapter callbacks are intentionally thin so the mechanism can be tested without full v4 plumbing.
///      Production integration should inherit BaseHook and call _recordProtectedSwap() from afterSwap.
contract RefundProtectionHook {
    error NotRouterOrHook();
    error UnsupportedPair();
    error ProtectionDisabled();
    error BelowMinOrAboveMax();
    error ExposureLimitReached();
    error OrderNotFound();
    error NotBuyer();
    error Expired();
    error AlreadyClosed();
    error NotExpired();
    error TransferFailed();
    error BadConfig();

    enum Status { NONE, ACTIVE, REFUNDED, FINALIZED }

    struct PairConfig {
        bool enabled;
        address stableToken;      // e.g. USDC/USDG/USDT0
        address projectToken;     // launched token
        uint256 minPrincipal;
        uint256 maxPrincipalPerOrder;
        uint256 maxPrincipalPerUserPerWindow;
        uint256 userWindowSeconds;
        uint256 protectionSeconds; // e.g. 24 hours
        uint16 basePremiumBps;     // paid upfront, not refunded
        uint16 refundFeeBps;       // deducted when refunding
        uint16 payoutBps;          // max refunded principal, e.g. 9500 = 95%
        uint16 maxExposureBps;     // total locked exposure <= vault balance * this bps
    }

    struct Order {
        Status status;
        address buyer;
        bytes32 pairId;
        uint256 principalPaid;
        uint256 tokenAmountOut;
        uint256 premiumPaid;
        uint256 maxPayout;
        uint256 createdAt;
        uint256 deadline;
    }

    RefundInsuranceVault public immutable vault;
    address public owner;
    address public authorizedRecorder; // v4 router/hook adapter in production
    uint256 public nextOrderId = 1;

    mapping(bytes32 pairId => PairConfig) public pairConfigs;
    mapping(uint256 orderId => Order) public orders;
    mapping(bytes32 key => uint256) public userWindowPrincipal;

    event OwnerSet(address indexed owner);
    event AuthorizedRecorderSet(address indexed recorder);
    event PairConfigured(bytes32 indexed pairId, address indexed stableToken, address indexed projectToken);
    event ProtectedSwapRecorded(uint256 indexed orderId, bytes32 indexed pairId, address indexed buyer, uint256 principal, uint256 tokenOut, uint256 premium, uint256 maxPayout, uint256 deadline);
    event Refunded(uint256 indexed orderId, address indexed buyer, uint256 payout, uint256 refundFee);
    event Finalized(uint256 indexed orderId, address indexed buyer);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotRouterOrHook();
        _;
    }

    modifier onlyRecorder() {
        if (msg.sender != authorizedRecorder && msg.sender != owner) revert NotRouterOrHook();
        _;
    }

    constructor(RefundInsuranceVault _vault) {
        vault = _vault;
        owner = msg.sender;
        authorizedRecorder = msg.sender;
        emit OwnerSet(msg.sender);
        emit AuthorizedRecorderSet(msg.sender);
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
        emit OwnerSet(newOwner);
    }

    function setAuthorizedRecorder(address recorder) external onlyOwner {
        authorizedRecorder = recorder;
        emit AuthorizedRecorderSet(recorder);
    }

    function pairId(address stableToken, address projectToken) public pure returns (bytes32) {
        return keccak256(abi.encode(stableToken, projectToken));
    }

    function configurePair(PairConfig calldata cfg) external onlyOwner returns (bytes32 id) {
        if (cfg.stableToken == address(0) || cfg.projectToken == address(0) || cfg.stableToken == cfg.projectToken) revert BadConfig();
        if (cfg.minPrincipal == 0 || cfg.minPrincipal > cfg.maxPrincipalPerOrder) revert BadConfig();
        if (cfg.maxPrincipalPerUserPerWindow < cfg.maxPrincipalPerOrder || cfg.userWindowSeconds == 0) revert BadConfig();
        if (cfg.basePremiumBps > 3_000 || cfg.refundFeeBps > 3_000 || cfg.payoutBps > 10_000 || cfg.maxExposureBps > 9_000) revert BadConfig();
        if (cfg.protectionSeconds == 0 || cfg.maxPrincipalPerOrder == 0) revert BadConfig();
        id = pairId(cfg.stableToken, cfg.projectToken);
        pairConfigs[id] = cfg;
        emit PairConfigured(id, cfg.stableToken, cfg.projectToken);
    }

    function quotePremium(bytes32 id, uint256 principal) public view returns (uint256 premium, uint256 maxPayout) {
        PairConfig memory cfg = pairConfigs[id];
        if (!cfg.enabled) revert ProtectionDisabled();
        if (principal < cfg.minPrincipal || principal > cfg.maxPrincipalPerOrder) revert BelowMinOrAboveMax();
        premium = principal * dynamicPremiumBps(id) / 10_000;
        maxPayout = principal * cfg.payoutBps / 10_000;
    }

    function dynamicPremiumBps(bytes32 id) public view returns (uint16) {
        PairConfig memory cfg = pairConfigs[id];
        uint256 bal = IERC20Minimal(cfg.stableToken).balanceOf(address(vault));
        if (bal == 0) return cfg.basePremiumBps;
        uint256 usageBps = vault.lockedExposure(cfg.stableToken) * 10_000 / bal;
        uint256 extra = usageBps / 5; // simple MVP curve: 50% usage adds 10 percentage points bps? 5000/5=1000 bps
        uint256 result = uint256(cfg.basePremiumBps) + extra;
        return result > 3_000 ? 3_000 : uint16(result);
    }

    /// @notice Called by v4 hook adapter after a protected USDC->TOKEN swap.
    /// @dev buyer must approve premium to this contract. In production, premium collection can be integrated with router calldata.
    function recordProtectedSwap(
        address buyer,
        address stableToken,
        address projectToken,
        uint256 principalPaid,
        uint256 tokenAmountOut
    ) external onlyRecorder returns (uint256 orderId) {
        bytes32 id = pairId(stableToken, projectToken);
        PairConfig memory cfg = pairConfigs[id];
        if (!cfg.enabled) revert ProtectionDisabled();
        if (principalPaid < cfg.minPrincipal || principalPaid > cfg.maxPrincipalPerOrder) revert BelowMinOrAboveMax();

        uint256 window = block.timestamp / cfg.userWindowSeconds;
        bytes32 userKey = keccak256(abi.encode(id, buyer, window));
        uint256 used = userWindowPrincipal[userKey] + principalPaid;
        if (used > cfg.maxPrincipalPerUserPerWindow) revert BelowMinOrAboveMax();
        userWindowPrincipal[userKey] = used;

        (uint256 premium, uint256 maxPayout) = quotePremium(id, principalPaid);

        uint256 vaultBalance = IERC20Minimal(stableToken).balanceOf(address(vault));
        uint256 maxExposure = vaultBalance * cfg.maxExposureBps / 10_000;
        if (vault.lockedExposure(stableToken) + maxPayout > maxExposure) revert ExposureLimitReached();

        _pull(stableToken, buyer, address(vault), premium);
        vault.lockExposure(stableToken, maxPayout);
        vault.distributeFees(stableToken, premium);

        orderId = nextOrderId++;
        orders[orderId] = Order({
            status: Status.ACTIVE,
            buyer: buyer,
            pairId: id,
            principalPaid: principalPaid,
            tokenAmountOut: tokenAmountOut,
            premiumPaid: premium,
            maxPayout: maxPayout,
            createdAt: block.timestamp,
            deadline: block.timestamp + cfg.protectionSeconds
        });

        emit ProtectedSwapRecorded(orderId, id, buyer, principalPaid, tokenAmountOut, premium, maxPayout, block.timestamp + cfg.protectionSeconds);
    }

    function refund(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.status == Status.NONE) revert OrderNotFound();
        if (o.buyer != msg.sender) revert NotBuyer();
        if (o.status != Status.ACTIVE) revert AlreadyClosed();
        if (block.timestamp > o.deadline) revert Expired();

        PairConfig memory cfg = pairConfigs[o.pairId];
        uint256 refundFee = o.principalPaid * cfg.refundFeeBps / 10_000;
        uint256 payout = o.maxPayout > refundFee ? o.maxPayout - refundFee : 0;

        _pull(cfg.projectToken, msg.sender, address(this), o.tokenAmountOut);
        _push(cfg.projectToken, owner, o.tokenAmountOut); // MVP: return tokens to project/treasury. Production may burn or add liquidity.

        if (refundFee > 0) {
            // Refund fee is economically retained because payout is reduced; no transfer needed.
            vault.releaseExposure(cfg.stableToken, refundFee);
            vault.distributeFees(cfg.stableToken, refundFee);
        }
        vault.payout(cfg.stableToken, msg.sender, payout);

        o.status = Status.REFUNDED;
        emit Refunded(orderId, msg.sender, payout, refundFee);
    }

    function finalize(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.status == Status.NONE) revert OrderNotFound();
        if (o.status != Status.ACTIVE) revert AlreadyClosed();
        if (block.timestamp <= o.deadline) revert NotExpired();
        PairConfig memory cfg = pairConfigs[o.pairId];
        vault.releaseExposure(cfg.stableToken, o.maxPayout);
        o.status = Status.FINALIZED;
        emit Finalized(orderId, o.buyer);
    }

    function _pull(address token, address from, address to, uint256 amount) internal {
        if (!IERC20Minimal(token).transferFrom(from, to, amount)) revert TransferFailed();
    }

    function _push(address token, address to, uint256 amount) internal {
        if (!IERC20Minimal(token).transfer(to, amount)) revert TransferFailed();
    }
}
