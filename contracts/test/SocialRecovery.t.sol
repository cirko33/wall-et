// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "../lib/forge-std/src/Test.sol";
import "../src/SocialRecovery.sol";
import "../lib/openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";

contract SocialRecoveryTest is Test {
    SocialRecovery public recovery;
    ERC20Mock public token1;
    ERC20Mock public token2;
    address public owner = address(0x1);
    address public recovery1 = address(0x2);
    address public recovery2 = address(0x3);
    address public recovery3 = address(0x4);
    address public notRecovery = address(0x5);
    address public recoverTo = address(0x6);

    function setUp() public {
        address[] memory recAddrs = new address[](2);
        recAddrs[0] = recovery1;
        recAddrs[1] = recovery2;
        vm.prank(owner);
        recovery = new SocialRecovery(recAddrs, 2);
        token1 = new ERC20Mock();
        token2 = new ERC20Mock();
        // Mint tokens to owner
        token1.mint(owner, 100);
        token2.mint(owner, 200);
    }

    function testConstructorSetsRecoveryAddressesAndQuorum() public view {
        assertTrue(recovery.recoveryAddresses(recovery1));
        assertTrue(recovery.recoveryAddresses(recovery2));
        assertEq(recovery.recoveryAddressCount(), 2);
        assertEq(recovery.quorum(), 2);
        assertFalse(recovery.recovered());
    }

    function testAddRecoveryAddressOnlyOwner() public {
        vm.prank(owner);
        recovery.addRecoveryAddress(recovery3);
        assertTrue(recovery.recoveryAddresses(recovery3));
        assertEq(recovery.recoveryAddressCount(), 3);
    }

    function test_RevertWhen_AddRecoveryAddressNotOwnerReverts() public {
        vm.prank(recovery1);
        vm.expectRevert();
        recovery.addRecoveryAddress(recovery3);
    }

    function testRemoveRecoveryAddressOnlyOwner() public {
        vm.prank(owner);
        recovery.addRecoveryAddress(recovery3);
        assertEq(recovery.recoveryAddressCount(), 3);
        vm.prank(owner);
        recovery.removeRecoveryAddress(recovery3);
        assertFalse(recovery.recoveryAddresses(recovery3));
        assertEq(recovery.recoveryAddressCount(), 2);
    }

    function test_RevertWhen_RemoveRecoveryAddressBelowQuorumReverts() public {
        vm.prank(owner);
        vm.expectRevert("Quorum not met");
        recovery.removeRecoveryAddress(recovery1);
    }

    function test_RevertWhen_RemoveRecoveryAddressZeroReverts() public {
        vm.prank(owner);
        recovery.addRecoveryAddress(recovery3);
        vm.prank(owner);
        recovery.removeRecoveryAddress(recovery3);
        vm.prank(owner);
        vm.expectRevert("Quorum not met");
        recovery.removeRecoveryAddress(recovery2);
    }

    function testAddTokenAndAddTokens() public {
        vm.prank(owner);
        recovery.addToken(address(token1));
        assertTrue(recovery.tokenMap(address(token1)));
        vm.prank(owner);
        address[] memory tokens = new address[](2);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        recovery.addTokens(tokens);
        assertTrue(recovery.tokenMap(address(token2)));
    }

    function testSetQuorumOnlyOwner() public {
        vm.prank(owner);
        recovery.setQuorum(1);
        assertEq(recovery.quorum(), 1);
    }

    function testSetQuorumNotOwnerReverts() public {
        vm.prank(recovery1);
        vm.expectRevert();
        recovery.setQuorum(1);
    }

    function test_RevertWhen_RecoverFlow() public {
        // Setup: add tokens
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        recovery.addToken(address(token2));
        // Approve SocialRecovery to transfer tokens from owner
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        vm.prank(owner);
        token2.approve(address(recovery), 200);
        // First recovery address votes
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        // Not enough votes yet
        assertFalse(recovery.recovered());
        // Second recovery address votes
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Should be recovered
        assertTrue(recovery.recovered());
        // Tokens should be transferred
        assertEq(token1.balanceOf(recoverTo), 100);
        assertEq(token2.balanceOf(recoverTo), 200);
        // Owner's balance should be zero
        assertEq(token1.balanceOf(owner), 0);
        assertEq(token2.balanceOf(owner), 0);
    }

    function testRecoverNotRecoveryAddressReverts() public {
        vm.prank(notRecovery);
        vm.expectRevert("Not a recovery address");
        recovery.recover(recoverTo);
    }

    function test_RevertWhen_RecoverAlreadyRecoveredReverts() public {
        // Setup: add token and approve
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        // Both recovery addresses vote
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Try to recover again
        vm.prank(recovery1);
        vm.expectRevert("Already recovered");
        recovery.recover(recoverTo);
    }

    function testRecoverToZeroAddressReverts() public {
        vm.prank(recovery1);
        vm.expectRevert("Invalid recovery address");
        recovery.recover(address(0));
    }

    function test_RevertWhen_RecoverDoubleVoteReverts() public {
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery1);
        vm.expectRevert("Already voted");
        recovery.recover(recoverTo);
    }

    function test_RevertWhen_RecoverTransfersAllowanceNotBalance() public {
        // Setup: add token, approve less than balance
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 50);
        // Owner has 100, allowance is 50
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Only 50 should be transferred
        assertEq(token1.balanceOf(recoverTo), 50);
        assertEq(token1.balanceOf(owner), 50);
    }

    function test_RevertWhen_RecoverTransfersBalanceNotAllowance() public {
        // Setup: add token, approve more than balance
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 200);
        // Owner has 100, allowance is 200
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Only 100 should be transferred
        assertEq(token1.balanceOf(recoverTo), 100);
        assertEq(token1.balanceOf(owner), 0);
    }

    function test_RevertWhen_AddRecoveryAddressAfterRecoveredReverts() public {
        // Setup: recover
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Try to add recovery address
        vm.prank(owner);
        vm.expectRevert("Already recovered");
        recovery.addRecoveryAddress(recovery3);
    }

    function test_RevertWhen_RemoveRecoveryAddressAfterRecoveredReverts()
        public
    {
        // Setup: recover
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Try to remove recovery address
        vm.prank(owner);
        vm.expectRevert("Already recovered");
        recovery.removeRecoveryAddress(recovery1);
    }

    function test_RevertWhen_AddTokenAfterRecoveredReverts() public {
        // Setup: recover
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Try to add token
        vm.prank(owner);
        vm.expectRevert("Already recovered");
        recovery.addToken(address(token2));
    }

    function test_RevertWhen_SetQuorumAfterRecoveredReverts() public {
        // Setup: recover
        vm.prank(owner);
        recovery.addToken(address(token1));
        vm.prank(owner);
        token1.approve(address(recovery), 100);
        vm.prank(recovery1);
        recovery.recover(recoverTo);
        vm.prank(recovery2);
        recovery.recover(recoverTo);
        // Try to set quorum
        vm.prank(owner);
        vm.expectRevert("Already recovered");
        recovery.setQuorum(1);
    }
}
