// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RefundProtectionHook} from "./RefundProtectionHook.sol";
import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @notice Thin Uniswap v4 hook adapter that forwards protected buys into the existing refund core.
/// @dev The core insurance logic stays in RefundProtectionHook / RefundInsuranceVault.
///      This contract only interprets v4 swap context and records opt-in protected buys.
contract UniswapV4RefundProtectionAdapter is BaseHook {
    using BalanceDeltaLibrary for BalanceDelta;
    using CurrencyLibrary for Currency;

    error InvalidHookData();
    error UnsupportedSwapShape();
    error ZeroSwapAmounts();

    struct ProtectionIntent {
        bool wantsProtection;
        address buyer;
    }

    RefundProtectionHook public immutable core;

    event ProtectedSwapForwarded(
        PoolId indexed poolId,
        address indexed buyer,
        address indexed stableToken,
        address projectToken,
        uint256 amountIn,
        uint256 amountOut,
        uint256 orderId
    );

    constructor(IPoolManager manager, RefundProtectionHook refundCore) BaseHook(manager) {
        core = refundCore;
    }

    /// @notice Hook permission bitmask used for address mining / CREATE2 deployment.
    function hookFlags() public pure returns (uint160) {
        return Hooks.AFTER_SWAP_FLAG;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @notice Convenience helper for routers/frontends preparing hookData.
    function encodeHookData(bool wantsProtection, address buyer) external pure returns (bytes memory) {
        return abi.encode(wantsProtection, buyer);
    }

    function _afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata,
        BalanceDelta delta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        ProtectionIntent memory intent = _decodeHookData(hookData);
        if (!intent.wantsProtection) {
            return (BaseHook.afterSwap.selector, 0);
        }

        address buyer = intent.buyer == address(0) ? sender : intent.buyer;
        (address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) = _swapFlow(key, delta);
        uint256 orderId = core.recordProtectedSwap(buyer, tokenIn, tokenOut, amountIn, amountOut);

        emit ProtectedSwapForwarded(
            PoolId.wrap(keccak256(abi.encode(key))),
            buyer,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            orderId
        );

        return (BaseHook.afterSwap.selector, 0);
    }

    function _decodeHookData(bytes calldata hookData) internal pure returns (ProtectionIntent memory intent) {
        if (hookData.length == 0) return intent;
        if (hookData.length != 64) revert InvalidHookData();
        (intent.wantsProtection, intent.buyer) = abi.decode(hookData, (bool, address));
    }

    function _swapFlow(PoolKey calldata key, BalanceDelta delta)
        internal
        pure
        returns (address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)
    {
        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        if (amount0 < 0 && amount1 > 0) {
            tokenIn = Currency.unwrap(key.currency0);
            tokenOut = Currency.unwrap(key.currency1);
            amountIn = uint128(-amount0);
            amountOut = uint128(amount1);
        } else if (amount1 < 0 && amount0 > 0) {
            tokenIn = Currency.unwrap(key.currency1);
            tokenOut = Currency.unwrap(key.currency0);
            amountIn = uint128(-amount1);
            amountOut = uint128(amount0);
        } else {
            revert UnsupportedSwapShape();
        }

        if (amountIn == 0 || amountOut == 0) revert ZeroSwapAmounts();
    }
}
