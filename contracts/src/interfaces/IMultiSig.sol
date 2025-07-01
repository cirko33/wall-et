// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

/**
 * @title IMultiSig
 * @dev Interface for the MultiSig contract
 */
interface IMultiSig {
    struct Transaction {
        address to;
        bool native;
        address token;
        uint256 amount;
        address proposer;
        uint256 timestamp;
        uint256 signedCount;
        bool executed;
        uint256 balance;
    }

    // View functions
    function signers(address signer) external view returns (bool);

    function minSignatures() external view returns (uint256);

    function transactions(
        bytes32 txHash
    )
        external
        view
        returns (
            address to,
            bool native,
            address token,
            uint256 amount,
            address proposer,
            uint256 timestamp,
            uint256 signedCount,
            bool executed,
            uint256 balance
        );

    function transactionSigners(
        bytes32 txHash,
        address signer
    ) external view returns (bool);

    function getBalance() external view returns (uint256);

    function getBalance(bytes32 txHash) external view returns (uint256);

    function getBalance(address token) external view returns (uint256);

    // State-changing functions
    function deposit(bytes32 txHash, address token, uint256 amount) external;

    function deposit(bytes32 txHash) external payable;

    function propose(
        address to,
        uint256 amount
    ) external returns (bytes32 txHash);

    function propose(
        address to,
        uint256 amount,
        address token
    ) external returns (bytes32 txHash);

    function sign(bytes32 txHash) external;

    function execute(bytes32 txHash) external;
}
