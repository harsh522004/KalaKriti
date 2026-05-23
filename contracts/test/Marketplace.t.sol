// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract MarketplaceTest is Test {
    Marketplace   public marketplace;
    NFTCollection public collection;

    address public deployer      = makeAddr("deployer");
    address public feeRecipient  = makeAddr("feeRecipient");
    address public seller        = makeAddr("seller");
    address public buyer         = makeAddr("buyer");
    address public royaltyTarget = makeAddr("royaltyTarget");

    uint96  constant ROYALTY_BPS = 500;   // 5%
    uint256 constant PRICE       = 1 ether;

    function setUp() public {
        vm.prank(deployer);
        marketplace = new Marketplace(feeRecipient);

        // Public collection, deployer owns it
        collection = new NFTCollection("KalaKriti", "KK", "ipfs://col", false, deployer);

        // Mint token 0 to seller, royalty goes to royaltyTarget
        vm.prank(seller);
        collection.mintNFT("ipfs://token0", royaltyTarget, ROYALTY_BPS);

        // Seller approves marketplace for token 0
        vm.prank(seller);
        collection.approve(address(marketplace), 0);
    }

    // ─── listNFT ───────────────────────────────────────────────────────────────

    function test_listNFT_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        (address s, address c, uint256 tid, uint256 p, bool active) = marketplace.listings(id);
        assertEq(s,   seller);
        assertEq(c,   address(collection));
        assertEq(tid, 0);
        assertEq(p,   PRICE);
        assertTrue(active);
    }

    function test_listNFT_setsNftIsListed() public {
        vm.prank(seller);
        marketplace.listNFT(address(collection), 0, PRICE);
        assertTrue(marketplace.nftIsListed(address(collection), 0));
    }

    function test_listNFT_emitsEvent() public {
        vm.prank(seller);
        vm.expectEmit(true, true, true, true);
        emit Marketplace.NFTListed(0, seller, address(collection), 0, PRICE);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotOwner.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsPriceZero() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.PriceZero.selector);
        marketplace.listNFT(address(collection), 0, 0);
    }

    function test_listNFT_revertsAlreadyListed() public {
        vm.prank(seller);
        marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        vm.expectRevert(Marketplace.AlreadyListed.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsNotApproved() public {
        // Revoke approval
        vm.prank(seller);
        collection.approve(address(0), 0);

        vm.prank(seller);
        vm.expectRevert(Marketplace.NotApproved.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_approvedForAll() public {
        // Revoke single approval, set approvalForAll instead
        vm.startPrank(seller);
        collection.approve(address(0), 0);
        collection.setApprovalForAll(address(marketplace), true);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.stopPrank();
        (, , , , bool active) = marketplace.listings(id);
        assertTrue(active);
    }

    // ─── cancelListing ────────────────────────────────────────────────────────

    function test_cancelListing_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        marketplace.cancelListing(id);

        (, , , , bool active) = marketplace.listings(id);
        assertFalse(active);
        assertFalse(marketplace.nftIsListed(address(collection), 0));
    }

    function test_cancelListing_emitsEvent() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        vm.expectEmit(true, false, false, false);
        emit Marketplace.ListingCancelled(id);
        marketplace.cancelListing(id);
    }

    function test_cancelListing_revertsNotSeller() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotSeller.selector);
        marketplace.cancelListing(id);
    }

    function test_cancelListing_revertsNotListed() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.cancelListing(999);
    }

    function test_cancelListing_allowsRelist() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.prank(seller);
        marketplace.cancelListing(id);

        // Should be able to list again
        vm.prank(seller);
        uint256 id2 = marketplace.listNFT(address(collection), 0, PRICE);
        (, , , , bool active) = marketplace.listings(id2);
        assertTrue(active);
    }

    // ─── buyNFT ───────────────────────────────────────────────────────────────

    function test_buyNFT_transfersOwnership() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        assertEq(collection.ownerOf(0), buyer);
    }

    function test_buyNFT_deactivatesListing() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        (, , , , bool active) = marketplace.listings(id);
        assertFalse(active);
        assertFalse(marketplace.nftIsListed(address(collection), 0));
    }

    function test_buyNFT_distributesPayments() public {
        // PRICE = 1 ether
        // royalty = 5% = 0.05 ether → royaltyTarget
        // fee    = 2% = 0.02 ether → feeRecipient
        // seller = 93% = 0.93 ether → seller
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        assertEq(marketplace.pendingWithdrawals(royaltyTarget), 0.05 ether);
        assertEq(marketplace.pendingWithdrawals(feeRecipient),  0.02 ether);
        assertEq(marketplace.pendingWithdrawals(seller),        0.93 ether);
    }

    function test_buyNFT_emitsEvent() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectEmit(true, true, true, false);
        emit Marketplace.NFTSold(id, buyer, seller, 0, PRICE);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsWrongPrice() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.WrongPrice.selector);
        marketplace.buyNFT{value: 0.5 ether}(id);
    }

    function test_buyNFT_revertsNotListed() public {
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.buyNFT{value: PRICE}(999);
    }

    function test_buyNFT_revertsSelfPurchase() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(seller, PRICE);
        vm.prank(seller);
        vm.expectRevert(Marketplace.SelfPurchase.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsSellerNoLongerOwner() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        // Seller transfers NFT away (clears approval too)
        vm.prank(seller);
        collection.transferFrom(seller, makeAddr("thirdParty"), 0);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotOwner.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsInactiveListing() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.prank(seller);
        marketplace.cancelListing(id);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    // ─── withdrawFunds ────────────────────────────────────────────────────────

    function test_withdrawFunds_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        uint256 owed = marketplace.pendingWithdrawals(seller);

        vm.prank(seller);
        marketplace.withdrawFunds();

        assertEq(seller.balance, owed);
        assertEq(marketplace.pendingWithdrawals(seller), 0);
    }

    function test_withdrawFunds_revertsNoFunds() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.NoFunds.selector);
        marketplace.withdrawFunds();
    }

    function test_withdrawFunds_zeroesBeforeTransfer() public {
        // Verify balance is cleared before ETH transfer (CEI pattern)
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        vm.prank(seller);
        marketplace.withdrawFunds();

        // Attempting to withdraw again must revert
        vm.prank(seller);
        vm.expectRevert(Marketplace.NoFunds.selector);
        marketplace.withdrawFunds();
    }
}
