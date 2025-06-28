// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMultiSig} from "./IMultiSig.sol";
/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */

contract MultiSig is IMultiSig {
    // Validator addresses
    mapping(address => bool) public signers;

    // Minimum number of signatures required for quorum
    uint256 public minSignatures;

    // Keccak256(Transaction) => bool
    mapping(bytes32 => Transaction) public transactions;
    mapping(bytes32 => mapping(address => bool)) public transactionSigners;

    /**
     * @dev Constructor - sets up validators and minimum signatures
     * @param _signers Array of validator addresses
     * @param _minSignatures Minimum number of signatures required for quorum
     */
    constructor(address[] memory _signers, uint256 _minSignatures) {
        require(_signers.length > 0, "Must have at least one signer");
        require(_minSignatures > 0, "Min signatures must be greater than 0");
        require(_minSignatures <= _signers.length, "Min signatures cannot exceed signer count");

        for (uint256 i = 0; i < _signers.length; i++) {
            signers[_signers[i]] = true;
        }
        minSignatures = _minSignatures;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getBalance(bytes32 txHash) public view returns (uint256) {
        return transactions[txHash].balance;
    }

    function getBalance(address token) public view returns (uint256) {
        IERC20 tokenContract = IERC20(token);
        return tokenContract.balanceOf(address(this));
    }

    function deposit(bytes32 txHash, address token, uint256 amount) external {
        require(transactions[txHash].proposer != address(0), "Transaction not found");

        IERC20 tokenContract = IERC20(token);
        tokenContract.transferFrom(msg.sender, address(this), amount);
        transactions[txHash].balance += amount;
    }

    function deposit(bytes32 txHash) external payable {
        require(transactions[txHash].proposer != address(0), "Transaction not found");
        transactions[txHash].balance += msg.value;
    }

    function propose(address to, uint256 amount) external returns (bytes32 txHash) {
        require(signers[msg.sender], "Only signers can propose");
        require(to != address(0), "Invalid target address");

        Transaction memory transaction = Transaction({
            to: to,
            amount: amount,
            native: true,
            token: address(0),
            proposer: msg.sender,
            timestamp: block.timestamp,
            signedCount: 0,
            executed: false,
            balance: 0
        });

        txHash = keccak256(abi.encodePacked(to, amount, msg.sender, transaction.timestamp));

        transactions[txHash] = transaction;

        return txHash;
    }

    function propose(address to, uint256 amount, address token) external returns (bytes32 txHash) {
        require(signers[msg.sender], "Only signers can propose");
        require(to != address(0), "Invalid target address");
        require(token != address(0), "Invalid token address");
        require(address(this).code.length > 0, "Contract not deployed");

        IERC20 tokenContract = IERC20(token);
        require(tokenContract.totalSupply() > 0, "Token not deployed");

        Transaction memory transaction = Transaction({
            to: to,
            native: false,
            token: token,
            amount: amount,
            proposer: msg.sender,
            timestamp: block.timestamp,
            signedCount: 0,
            executed: false,
            balance: 0
        });

        txHash = keccak256(abi.encodePacked(to, amount, msg.sender, transaction.timestamp));

        transactions[txHash] = transaction;

        return txHash;
    }

    //sign

    function sign(bytes32 txHash) external {
        Transaction storage transaction = transactions[txHash];

        require(!transaction.executed, "Transaction already executed");
        require(!transactionSigners[txHash][msg.sender], "Already signed");
        require(signers[msg.sender], "Only signers can sign");

        transactionSigners[txHash][msg.sender] = true;
        transaction.signedCount++;
    }

    //execute

    function execute(bytes32 txHash) external {
        Transaction storage transaction = transactions[txHash];
        require(transaction.proposer != address(0), "Transaction not found");
        require(transaction.signedCount >= minSignatures, "Not enough signatures");
        require(!transaction.executed, "Transaction already executed");
        require(signers[msg.sender], "Only signers can execute");
        if (transaction.native) {
            require(transaction.balance >= transaction.amount, "Not enough balance");

            //TODO think about reentrancy
            transaction.executed = true;
            (bool success,) = transaction.to.call{value: transaction.amount}("");

            require(success, "Execution failed");
        } else {
            require(transaction.balance >= transaction.amount, "Not enough balance");

            IERC20 tokenContract = IERC20(transaction.token);

            transaction.executed = true;
            bool success = tokenContract.transfer(transaction.to, transaction.amount);

            require(success, "Execution failed");
        }
    }
}
