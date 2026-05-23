// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {NFTCollection} from "./NFTCollection.sol";

contract CollectionFactory {
    address[] public allCollections;
    mapping(address => address[]) public collectionsByOwner;

    event CollectionCreated(address indexed collectionAddress, address indexed owner);

    function createCollection(
        string memory name,
        string memory symbol,
        string memory collectionURI,
        bool privateMint
    ) external returns (address) {
        NFTCollection collection = new NFTCollection(
            name,
            symbol,
            collectionURI,
            privateMint,
            msg.sender
        );

        address collectionAddr = address(collection);
        allCollections.push(collectionAddr);
        collectionsByOwner[msg.sender].push(collectionAddr);

        emit CollectionCreated(collectionAddr, msg.sender);
        return collectionAddr;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getCollectionsByOwner(address owner) external view returns (address[] memory) {
        return collectionsByOwner[owner];
    }
}
