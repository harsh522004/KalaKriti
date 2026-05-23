// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract CollectionFactoryTest is Test {
    CollectionFactory public factory;

    address public alice = makeAddr("alice");
    address public bob   = makeAddr("bob");

    function setUp() public {
        factory = new CollectionFactory();
    }

    function test_createCollection_returnsAddress() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertTrue(addr != address(0));
    }

    function test_createCollection_storesInAllCollections() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(factory.allCollections(0), addr);
        assertEq(factory.getAllCollections().length, 1);
    }

    function test_createCollection_storesByOwner() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(factory.getCollectionsByOwner(alice).length, 1);
        assertEq(factory.getCollectionsByOwner(alice)[0], addr);
    }

    function test_createCollection_setsCollectionOwner() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(NFTCollection(addr).owner(), alice);
    }

    function test_createCollection_setsPrivateMint() public {
        vm.prank(alice);
        address addr = factory.createCollection("Private", "PVT", "ipfs://uri", true);
        assertTrue(NFTCollection(addr).privateMint());
    }

    function test_createCollection_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(false, true, false, false); // skip addr check, check owner
        emit CollectionFactory.CollectionCreated(address(0), alice);
        factory.createCollection("Art", "ART", "ipfs://uri", false);
    }

    function test_createCollection_multipleByOneOwner() public {
        vm.startPrank(alice);
        factory.createCollection("Art1", "A1", "ipfs://uri1", false);
        factory.createCollection("Art2", "A2", "ipfs://uri2", false);
        vm.stopPrank();

        assertEq(factory.getAllCollections().length, 2);
        assertEq(factory.getCollectionsByOwner(alice).length, 2);
    }

    function test_createCollection_separatesOwners() public {
        vm.prank(alice);
        factory.createCollection("AliceArt", "AA", "ipfs://uri", false);
        vm.prank(bob);
        factory.createCollection("BobArt",   "BA", "ipfs://uri", false);

        assertEq(factory.getCollectionsByOwner(alice).length, 1);
        assertEq(factory.getCollectionsByOwner(bob).length,   1);
        assertEq(factory.getAllCollections().length, 2);
    }
}
