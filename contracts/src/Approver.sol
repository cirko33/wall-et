// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IMultiSig.sol";

/**
 * @title Approver
 * @dev Contract that holds ERC-20 tokens and approves spenders to use them
 * Can be delegated to by EOAs using EIP-7702
 */
contract Approver {
    /**
     * @dev Approve ERC-20 tokens for a spender
     * @param token The ERC-20 token address
     * @param spender The address that will spend the tokens
     * @param amount The amount of tokens to approve
     */
    function approveToken(
        address token,
        address spender,
        uint256 amount
    ) public returns (bool) {
        require(token != address(0), "Invalid token address");
        require(spender != address(0), "Invalid spender address");

        // Execute the ERC-20 approval from THIS contract
        bool success = IERC20(token).approve(spender, amount);
        require(success, "ERC-20 approval failed");

        return true;
    }

    /**
     * @dev Deposit ERC-20 tokens to MultiSig contract
     * @param multiSigAddress The address of the MultiSig contract
     * @param txHash The transaction hash for the deposit
     * @param token The ERC-20 token address
     * @param amount The amount of tokens to deposit
     */
    function depositTokenToMultiSig(
        address multiSigAddress,
        bytes32 txHash,
        address token,
        uint256 amount
    ) public {
        require(multiSigAddress != address(0), "Invalid MultiSig address");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        IMultiSig(multiSigAddress).deposit(txHash, token, amount);
    }

    /**
     * @dev Combined function for EIP-7702: Approve tokens and deposit to MultiSig
     * @param token The ERC-20 token address to approve
     * @param multiSigAddress The address of the MultiSig contract
     * @param txHash The transaction hash for the deposit
     * @param depositAmount The amount of tokens to deposit to MultiSig
     */
    function approveAndDeposit(
        address token,
        address multiSigAddress,
        bytes32 txHash,
        uint256 depositAmount
    ) external {
        this.approveToken(token, multiSigAddress, depositAmount);
        this.depositTokenToMultiSig(
            multiSigAddress,
            txHash,
            token,
            depositAmount
        );
    }

    /**
     * @dev Get the contract's token balance
     * @param token The ERC-20 token address
     * @return The contract's token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get the allowance for a spender
     * @param token The ERC-20 token address
     * @param spender The spender address
     * @return The allowance amount
     */
    function getAllowance(
        address token,
        address spender
    ) external view returns (uint256) {
        return IERC20(token).allowance(address(this), spender);
    }
}
