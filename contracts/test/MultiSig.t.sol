// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "../lib/forge-std/src/Test.sol";
import "../src/MultiSig.sol";
import "../lib/openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";

contract MultiSigTest is Test {
    MultiSig public multiSig;
    ERC20Mock public erc20;

    address[] public signers;
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public dave = address(0x4);
    address public eve = address(0x5);
    address nonSigner = address(0x999);

    uint256 public minSignatures = 3;

    function setUp() public {
        signers = [alice, bob, charlie, dave, eve];
        multiSig = new MultiSig(signers, minSignatures);
        erc20 = new ERC20Mock();
        // Fund the contract with some ETH
        vm.deal(address(multiSig), 10 ether);
        // Mint ERC20 tokens to Alice for testing
        erc20.mint(alice, 1000 ether);
    }

    function testSetup() public view {
        assertEq(multiSig.minSignatures(), 3);
        assertTrue(multiSig.signers(alice));
        assertTrue(multiSig.signers(bob));
        assertTrue(multiSig.signers(charlie));
        assertTrue(multiSig.signers(dave));
        assertTrue(multiSig.signers(eve));
    }

    function testAliceProposesTransactionToBob() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        (
            address to,
            bool native,
            address token,
            uint256 amount,
            address proposer,
            ,
            uint256 signedCount,
            bool executed,
            uint256 balance
        ) = multiSig.transactions(txHash);
        assertEq(to, bob);
        assertEq(amount, 3 ether);
        assertEq(proposer, alice);
        assertEq(signedCount, 0);
        assertFalse(executed);
        assertEq(balance, 0);
        assertEq(native, true);
        assertEq(token, address(0));
    }

    function test_RevertWhen_ExecuteNonExistentTransaction() public {
        // Create a fake txHash that doesn't exist
        bytes32 fakeTxHash = keccak256(abi.encodePacked("fake transaction"));

        // Try to execute non-existent transaction
        vm.prank(alice);
        vm.expectRevert("Transaction not found");
        multiSig.execute(fakeTxHash);
    }

    function test_RevertWhen_ExecuteWithoutEnoughSignatures() public {
        // Alice proposes transaction to send 3 eth to Bob
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Alice tries to execute without enough signatures (only 0 signatures, need 3)
        vm.prank(alice);
        vm.expectRevert("Not enough signatures");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ExecuteWithoutEnoughFunds() public {
        // Alice proposes transaction to send 3 eth to Bob
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Get enough signatures (3 out of 5)
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        // Try to execute with enough signatures but insufficient funds
        vm.prank(alice);
        vm.expectRevert("Not enough balance");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ExecuteByNonSigner() public {
        // Alice proposes transaction to send 3 eth to Bob
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Deposit enough funds
        multiSig.deposit{value: 3 ether}(txHash);

        // Get enough signatures (3 out of 5)
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        // Try to execute with non-signer (address 0x999)
        vm.prank(nonSigner);
        vm.expectRevert("Only signers can execute");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ProposeByNonSigner() public {
        vm.prank(nonSigner);
        vm.expectRevert("Only signers can propose");
        multiSig.propose(bob, 3 ether);
    }

    function test_RevertWhen_ProposeToZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert("Invalid target address");
        multiSig.propose(address(0), 3 ether);
    }

    function test_RevertWhen_SignByNonSigner() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        vm.prank(nonSigner);
        vm.expectRevert("Only signers can sign");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_SignAlreadySigned() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Sign first time
        vm.prank(alice);
        multiSig.sign(txHash);

        // Try to sign again
        vm.prank(alice);
        vm.expectRevert("Already signed");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_SignExecutedTransaction() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Fund and get signatures
        multiSig.deposit{value: 3 ether}(txHash);
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        // Execute transaction
        vm.prank(alice);
        multiSig.execute(txHash);

        // Try to sign executed transaction
        vm.prank(dave);
        vm.expectRevert("Transaction already executed");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_ExecuteAlreadyExecuted() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Fund and get signatures
        multiSig.deposit{value: 3 ether}(txHash);
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        // Execute first time
        vm.prank(alice);
        multiSig.execute(txHash);

        // Try to execute again
        vm.prank(alice);
        vm.expectRevert("Transaction already executed");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_DepositToNonExistentTransaction() public {
        bytes32 fakeTxHash = keccak256(abi.encodePacked("fake transaction"));
        vm.expectRevert("Transaction not found");
        multiSig.deposit{value: 1 ether}(fakeTxHash);
    }

    function test_SuccessfulExecution() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 3 ether);

        // Fund transaction
        multiSig.deposit{value: 3 ether}(txHash);

        // Get enough signatures
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        // Execute successfully
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(alice);
        multiSig.execute(txHash);

        // Verify execution
        (, , , , , , , bool executed, ) = multiSig.transactions(txHash);
        assertTrue(executed);
        assertEq(bob.balance, bobBalanceBefore + 3 ether);
    }

    function test_GetBalance() public view {
        assertEq(multiSig.getBalance(), 10 ether);
    }

    function test_ConstructorValidation() public {
        // Test constructor with invalid parameters
        address[] memory emptySigners = new address[](0);
        vm.expectRevert("Must have at least one signer");
        new MultiSig(emptySigners, 1);

        address[] memory validSigners = new address[](2);
        validSigners[0] = alice;
        validSigners[1] = bob;

        vm.expectRevert("Min signatures must be greater than 0");
        new MultiSig(validSigners, 0);

        vm.expectRevert("Min signatures cannot exceed signer count");
        new MultiSig(validSigners, 3);
    }

    function test_SignatureCounting() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 1 ether);

        (, , , , , , uint256 signedCount, , ) = multiSig.transactions(txHash);
        assertEq(signedCount, 0);

        vm.prank(alice);
        multiSig.sign(txHash);
        (, , , , , , signedCount, , ) = multiSig.transactions(txHash);
        assertEq(signedCount, 1);

        vm.prank(bob);
        multiSig.sign(txHash);
        (, , , , , , signedCount, , ) = multiSig.transactions(txHash);
        assertEq(signedCount, 2);

        vm.prank(charlie);
        multiSig.sign(txHash);
        (, , , , , , signedCount, , ) = multiSig.transactions(txHash);
        assertEq(signedCount, 3);
    }

    function test_TransactionSignersMapping() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 1 ether);

        assertFalse(multiSig.transactionSigners(txHash, alice));

        vm.prank(alice);
        multiSig.sign(txHash);
        assertTrue(multiSig.transactionSigners(txHash, alice));
        assertFalse(multiSig.transactionSigners(txHash, bob));
    }

    function testERC20_ProposeDepositSignExecute() public {
        // Alice proposes an ERC20 transfer to Bob
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 100 ether, address(erc20));
        // Alice deposits tokens to the multisig for this tx
        vm.prank(alice);
        erc20.approve(address(multiSig), 100 ether);
        vm.prank(alice);
        multiSig.deposit(txHash, address(erc20), 100 ether);
        // Get enough signatures
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);
        // Execute the transaction
        uint256 bobBalanceBefore = erc20.balanceOf(bob);
        vm.prank(alice);
        multiSig.execute(txHash);
        // Check execution
        (, , , , , , , bool executed, ) = multiSig.transactions(txHash);
        assertTrue(executed);
        assertEq(erc20.balanceOf(bob), bobBalanceBefore + 100 ether);
    }

    function testERC20_RevertWhen_InsufficientTokenBalance() public {
        // Alice proposes an ERC20 transfer to Bob
        vm.prank(alice);
        bytes32 txHash = multiSig.propose(bob, 100 ether, address(erc20));
        // Only deposit 50 tokens
        vm.prank(alice);
        erc20.approve(address(multiSig), 50 ether);
        vm.prank(alice);
        multiSig.deposit(txHash, address(erc20), 50 ether);
        // Get enough signatures
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);
        // Try to execute (should revert)
        vm.prank(alice);
        vm.expectRevert("Not enough balance");
        multiSig.execute(txHash);
    }

    function testERC20_RevertWhen_ProposeByNonSigner() public {
        vm.prank(nonSigner);
        vm.expectRevert("Only signers can propose");
        multiSig.propose(bob, 100 ether, address(erc20));
    }

    function testERC20_RevertWhen_ProposeToZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert("Invalid target address");
        multiSig.propose(address(0), 100 ether, address(erc20));
    }

    function testERC20_RevertWhen_ProposeWithZeroToken() public {
        vm.prank(alice);
        vm.expectRevert("Invalid token address");
        multiSig.propose(bob, 100 ether, address(0));
    }
}
