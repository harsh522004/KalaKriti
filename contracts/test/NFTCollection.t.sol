// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract NFTCollectionTest is Test {
    NFTCollection public collection;
    NFTCollection public privateCollection;

    address public owner = makeAddr("owner");
    address public user  = makeAddr("user");

    string constant TOKEN_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    function setUp() public {
        collection        = new NFTCollection("KalaKriti", "KK",  "ipfs://colURI", false, owner);
        privateCollection = new NFTCollection("Private",   "PVT", "ipfs://colURI", true,  owner);
    }

    function test_mintNFT_returnsTokenId() public {
        vm.prank(user);
        uint256 tokenId = collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(tokenId, 0);
    }

    function test_mintNFT_mintsToSender() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(collection.ownerOf(0), user);
    }

    function test_mintNFT_storesTokenURI() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(collection.tokenURI(0), TOKEN_URI);
    }

    function test_mintNFT_incrementsCounter() public {
        vm.startPrank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        collection.mintNFT(TOKEN_URI, user, 500);
        vm.stopPrank();
        assertEq(collection.tokenCounter(), 2);
    }

    function test_mintNFT_setsRoyalty() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500); // 5% royalty
        (address receiver, uint256 amount) = collection.royaltyInfo(0, 10_000);
        assertEq(receiver, user);
        assertEq(amount, 500); // 5% of 10000
    }

    function test_mintNFT_emitsEvent() public {
        vm.prank(user);
        vm.expectEmit(true, true, false, false);
        emit NFTCollection.NFTMinted(0, user);
        collection.mintNFT(TOKEN_URI, user, 500);
    }

    function test_mintNFT_private_ownerSucceeds() public {
        vm.prank(owner);
        uint256 tokenId = privateCollection.mintNFT(TOKEN_URI, owner, 500);
        assertEq(tokenId, 0);
    }

    function test_mintNFT_private_userReverts() public {
        vm.prank(user);
        vm.expectRevert(NFTCollection.NotAuthorized.selector);
        privateCollection.mintNFT(TOKEN_URI, user, 500);
    }

    function test_supportsInterface_ERC721() public view {
        assertTrue(collection.supportsInterface(0x80ac58cd));
    }

    function test_supportsInterface_ERC2981() public view {
        assertTrue(collection.supportsInterface(0x2a55205a));
    }

    function test_supportsInterface_ERC165() public view {
        assertTrue(collection.supportsInterface(0x01ffc9a7));
    }
}
