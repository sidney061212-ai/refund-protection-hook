// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20Minimal} from "./IERC20Minimal.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

/// @notice Tiny mainnet demo helper for X Layer hackathon evidence.
/// @dev It is intentionally narrow: ERC20 pools only, add liquidity, exact-input swap, settle/take deltas.
contract UniswapV4DemoHelper is IUnlockCallback {
    using BalanceDeltaLibrary for BalanceDelta;

    error OnlyPoolManager();
    error NativeCurrencyUnsupported();

    enum Action {
        AddLiquidity,
        SwapExactInput
    }

    struct CallbackData {
        Action action;
        address payer;
        PoolKey key;
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
        bytes32 salt;
        bool zeroForOne;
        uint128 amountIn;
        bytes hookData;
    }

    IPoolManager public immutable manager;

    event DemoLiquidityAdded(address indexed payer, bytes32 indexed salt, int256 liquidityDelta, int128 amount0, int128 amount1);
    event DemoSwap(address indexed payer, bool zeroForOne, uint128 amountIn, int128 amount0, int128 amount1);

    constructor(IPoolManager poolManager) {
        manager = poolManager;
    }

    function addLiquidity(
        PoolKey calldata key,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta,
        bytes32 salt
    ) external returns (BalanceDelta delta) {
        bytes memory result = manager.unlock(abi.encode(CallbackData({
            action: Action.AddLiquidity,
            payer: msg.sender,
            key: key,
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: liquidityDelta,
            salt: salt,
            zeroForOne: false,
            amountIn: 0,
            hookData: ""
        })));
        delta = abi.decode(result, (BalanceDelta));
    }

    function swapExactInput(
        PoolKey calldata key,
        bool zeroForOne,
        uint128 amountIn,
        bytes calldata hookData
    ) external returns (BalanceDelta delta) {
        bytes memory result = manager.unlock(abi.encode(CallbackData({
            action: Action.SwapExactInput,
            payer: msg.sender,
            key: key,
            tickLower: 0,
            tickUpper: 0,
            liquidityDelta: 0,
            salt: bytes32(0),
            zeroForOne: zeroForOne,
            amountIn: amountIn,
            hookData: hookData
        })));
        delta = abi.decode(result, (BalanceDelta));
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        if (msg.sender != address(manager)) revert OnlyPoolManager();
        CallbackData memory data = abi.decode(rawData, (CallbackData));

        BalanceDelta delta;
        if (data.action == Action.AddLiquidity) {
            (delta,) = manager.modifyLiquidity(
                data.key,
                ModifyLiquidityParams({
                    tickLower: data.tickLower,
                    tickUpper: data.tickUpper,
                    liquidityDelta: data.liquidityDelta,
                    salt: data.salt
                }),
                ""
            );
            _settleOrTake(data.key.currency0, data.payer, delta.amount0());
            _settleOrTake(data.key.currency1, data.payer, delta.amount1());
            emit DemoLiquidityAdded(data.payer, data.salt, data.liquidityDelta, delta.amount0(), delta.amount1());
        } else {
            delta = manager.swap(
                data.key,
                SwapParams({
                    zeroForOne: data.zeroForOne,
                    amountSpecified: -int256(uint256(data.amountIn)),
                    sqrtPriceLimitX96: data.zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
                }),
                data.hookData
            );
            _settleOrTake(data.key.currency0, data.payer, delta.amount0());
            _settleOrTake(data.key.currency1, data.payer, delta.amount1());
            emit DemoSwap(data.payer, data.zeroForOne, data.amountIn, delta.amount0(), delta.amount1());
        }

        return abi.encode(delta);
    }

    function _settleOrTake(Currency currency, address payer, int128 delta) internal {
        if (delta == 0) return;
        address token = Currency.unwrap(currency);
        if (token == address(0)) revert NativeCurrencyUnsupported();

        if (delta < 0) {
            uint256 amount = uint128(-delta);
            manager.sync(currency);
            if (!IERC20Minimal(token).transferFrom(payer, address(manager), amount)) revert();
            manager.settle();
        } else {
            manager.take(currency, payer, uint128(delta));
        }
    }
}
