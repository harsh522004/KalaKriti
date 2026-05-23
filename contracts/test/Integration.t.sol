// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {NFTCollection} from "../src/NFTCollection.sol";
import {Marketplace} from "../src/Marketplace.sol";

contract IntegrationTest is Test {
    CollectionFactory public factory;
    Marketplace       public marketplace;

    address public platform = makeAddr("platform");
    address public artist   = makeAddr("artist");
    address public buyer1   = makeAddr("buyer1");
    address public buyer2   = makeAddr("buyer2");

    function setUp() public {
        factory     = new CollectionFactory();
        marketplace = new Marketplace(platform);
    }

    function test_fullFlow_mintListBuyWithdraw() public {
        // 1. Artist creates a collection
        vm.prank(artist);
        address collectionAddr = factory.createCollection("ArtByArtist", "ABA", "ipfs://col", false);
        NFTCollection collection = NFTCollection(collectionAddr);

        // 2. Artist mints an NFT (artist gets 5% royalty on resales)
        vm.prank(artist);
        uint256 tokenId = collection.mintNFT("ipfs://token0", artist, 500);
        assertEq(collection.ownerOf(tokenId), artist);

        // 3. Artist approves marketplace and lists for 1 ETH
        vm.startPrank(artist);
        collection.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.listNFT(collectionAddr, tokenId, 1 ether);
        vm.stopPrank();

        // 4. Buyer1 purchases
        vm.deal(buyer1, 1 ether);
        vm.prank(buyer1);
        marketplace.buyNFT{value: 1 ether}(listingId);

        assertEq(collection.ownerOf(tokenId), buyer1);

        // Payment distribution: 1 ETH total
        // royalty = 5% = 0.05 ETH → artist
        // fee     = 2% = 0.02 ETH → platform
        // seller  = 93%= 0.93 ETH → artist (was minter/seller both)
        // artist total pending = 0.05 + 0.93 = 0.98 ETH
        assertEq(marketplace.pendingWithdrawals(artist),   0.98 ether);
        assertEq(marketplace.pendingWithdrawals(platform), 0.02 ether);

        // 5. Buyer1 relists for 2 ETH
        vm.startPrank(buyer1);
        collection.approve(address(marketplace), tokenId);
        uint256 listingId2 = marketplace.listNFT(collectionAddr, tokenId, 2 ether);
        vm.stopPrank();

        // 6. Buyer2 purchases from buyer1
        vm.deal(buyer2, 2 ether);
        vm.prank(buyer2);
        marketplace.buyNFT{value: 2 ether}(listingId2);

        assertEq(collection.ownerOf(tokenId), buyer2);

        // On 2 ETH sale:
        // royalty = 5% = 0.1 ETH → artist
        // fee     = 2% = 0.04 ETH → platform
        // seller  = 93%= 1.86 ETH → buyer1
        assertEq(marketplace.pendingWithdrawals(buyer1),   1.86 ether);
        assertEq(marketplace.pendingWithdrawals(artist),   0.98 ether + 0.1 ether);
        assertEq(marketplace.pendingWithdrawals(platform), 0.02 ether + 0.04 ether);

        // 7. All parties withdraw
        vm.prank(artist);
        marketplace.withdrawFunds();
        assertEq(artist.balance, 1.08 ether);

        vm.prank(buyer1);
        marketplace.withdrawFunds();
        assertEq(buyer1.balance, 1.86 ether);

        vm.prank(platform);
        marketplace.withdrawFunds();
        assertEq(platform.balance, 0.06 ether);
    }

    function test_fullFlow_cancelAndRelist() public {
        vm.prank(artist);
        address collectionAddr = factory.createCollection("Art", "A", "ipfs://col", false);
        NFTCollection collection = NFTCollection(collectionAddr);

        vm.prank(artist);
        uint256 tokenId = collection.mintNFT("ipfs://token0", artist, 500);

        vm.startPrank(artist);
        collection.approve(address(marketplace), tokenId);
        uint256 id1 = marketplace.listNFT(collectionAddr, tokenId, 1 ether);
        marketplace.cancelListing(id1);

        // Must approve again after cancel (approval still held since NFT didn't move)
        uint256 id2 = marketplace.listNFT(collectionAddr, tokenId, 2 ether);
        vm.stopPrank();

        (, , , uint256 price, bool active) = marketplace.listings(id2);
        assertEq(price, 2 ether);
        assertTrue(active);
    }
}
