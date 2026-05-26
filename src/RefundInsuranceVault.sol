// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20Minimal} from "./IERC20Minimal.sol";

/// @notice Reserve vault for opt-in refundable swap protection.
/// @dev MVP: owner is expected to be the hook/deployer; production should use AccessControl/multisig.
contract RefundInsuranceVault {
    error NotOwner();
    error NotHook();
    error UnsupportedStable();
    error InsufficientFreeReserve();
    error TransferFailed();
    error BadBps();

    event StableSupported(address indexed stable, bool supported);
    event HookSet(address indexed hook);
    event Deposited(address indexed stable, address indexed from, uint256 amount);
    event ExposureLocked(address indexed stable, uint256 amount);
    event ExposureReleased(address indexed stable, uint256 amount);
    event PaidOut(address indexed stable, address indexed to, uint256 amount);
    event FeesDistributed(address indexed stable, uint256 toReserve, uint256 toProject, uint256 toProtocol);

    address public owner;
    address public hook;
    address public projectTreasury;
    address public protocolTreasury;

    uint16 public projectFeeShareBps = 1_000; // 10%
    uint16 public protocolFeeShareBps = 1_000; // 10%

    mapping(address stable => bool) public supportedStable;
    mapping(address stable => uint256) public lockedExposure;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyHook() {
        if (msg.sender != hook) revert NotHook();
        _;
    }

    constructor(address _projectTreasury, address _protocolTreasury) {
        owner = msg.sender;
        projectTreasury = _projectTreasury;
        protocolTreasury = _protocolTreasury;
    }

    function setHook(address _hook) external onlyOwner {
        hook = _hook;
        emit HookSet(_hook);
    }

    function setStable(address stable, bool supported) external onlyOwner {
        supportedStable[stable] = supported;
        emit StableSupported(stable, supported);
    }

    function setTreasuries(address _projectTreasury, address _protocolTreasury) external onlyOwner {
        projectTreasury = _projectTreasury;
        protocolTreasury = _protocolTreasury;
    }

    function setFeeShares(uint16 projectBps, uint16 protocolBps) external onlyOwner {
        if (projectBps + protocolBps > 5_000) revert BadBps(); // reserve must keep at least 50%
        projectFeeShareBps = projectBps;
        protocolFeeShareBps = protocolBps;
    }

    function deposit(address stable, uint256 amount) external {
        if (!supportedStable[stable]) revert UnsupportedStable();
        _pull(stable, msg.sender, amount);
        emit Deposited(stable, msg.sender, amount);
    }

    function freeReserve(address stable) public view returns (uint256) {
        uint256 bal = IERC20Minimal(stable).balanceOf(address(this));
        uint256 locked = lockedExposure[stable];
        return bal > locked ? bal - locked : 0;
    }

    function lockExposure(address stable, uint256 amount) external onlyHook {
        if (!supportedStable[stable]) revert UnsupportedStable();
        if (freeReserve(stable) < amount) revert InsufficientFreeReserve();
        lockedExposure[stable] += amount;
        emit ExposureLocked(stable, amount);
    }

    function releaseExposure(address stable, uint256 amount) external onlyHook {
        uint256 locked = lockedExposure[stable];
        lockedExposure[stable] = amount > locked ? 0 : locked - amount;
        emit ExposureReleased(stable, amount);
    }

    function payout(address stable, address to, uint256 amount) external onlyHook {
        if (lockedExposure[stable] < amount) revert InsufficientFreeReserve();
        lockedExposure[stable] -= amount;
        _push(stable, to, amount);
        emit PaidOut(stable, to, amount);
    }

    /// @notice Distribute collected premium/refund fees. Tokens must already be in this vault.
    function distributeFees(address stable, uint256 amount) external onlyHook {
        uint256 projectCut = amount * projectFeeShareBps / 10_000;
        uint256 protocolCut = amount * protocolFeeShareBps / 10_000;
        uint256 reserveCut = amount - projectCut - protocolCut;
        if (projectCut > 0) _push(stable, projectTreasury, projectCut);
        if (protocolCut > 0) _push(stable, protocolTreasury, protocolCut);
        emit FeesDistributed(stable, reserveCut, projectCut, protocolCut);
    }

    function _pull(address token, address from, uint256 amount) internal {
        if (!IERC20Minimal(token).transferFrom(from, address(this), amount)) revert TransferFailed();
    }

    function _push(address token, address to, uint256 amount) internal {
        if (!IERC20Minimal(token).transfer(to, amount)) revert TransferFailed();
    }
}
