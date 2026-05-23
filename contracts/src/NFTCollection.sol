// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721URIStorage, ERC2981, Ownable {
    bool public privateMint;
    uint256 public tokenCounter;
    string public collectionURI;

    event NFTMinted(uint256 indexed tokenId, address indexed creator);

    error NotAuthorized();

    constructor(
        string memory name,
        string memory symbol,
        string memory _collectionURI,
        bool _privateMint,
        address owner
    ) ERC721(name, symbol) Ownable(owner) {
        privateMint = _privateMint;
        collectionURI = _collectionURI;
    }

    function mintNFT(
        string memory tokenURI,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) external returns (uint256) {}

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC2981) returns (bool)
    {}
}
