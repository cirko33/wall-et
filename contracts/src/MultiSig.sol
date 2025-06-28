// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract MultiSig {
    // Validator addresses
    mapping(address => bool) public signers;

    // Minimum number of signatures required for quorum
    uint256 public minSignatures;

    struct Transaction {
        address to;
        uint256 amount;
        address proposer;
        uint256 timestamp;
        uint256 signedCount;
        bool executed;
        uint256 balance;
    }

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
        require(!transactions[txHash].executed, "Transaction already executed");
        require(!transactionSigners[txHash][msg.sender], "Already signed");
        require(signers[msg.sender], "Only signers can sign");

        transactionSigners[txHash][msg.sender] = true;
        transactions[txHash].signedCount++;
    }
    //execute

    function execute(bytes32 txHash) external {
        require(transactions[txHash].proposer != address(0), "Transaction not found");
        require(transactions[txHash].signedCount >= minSignatures, "Not enough signatures");
        require(transactions[txHash].balance >= transactions[txHash].amount, "Not enough balance");
        require(!transactions[txHash].executed, "Transaction already executed");
        require(signers[msg.sender], "Only signers can execute");

        //TODO think about reentrancy
        transactions[txHash].executed = true;
        (bool success,) = transactions[txHash].to.call{value: transactions[txHash].amount}("");
        require(success, "Execution failed");
    }
}
