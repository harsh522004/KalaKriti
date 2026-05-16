// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyCollection is ERC721URIStorage, Ownable{

    uint256 _counter = 0;

    constructor() ERC721("KalaKriti", "KK") Ownable(msg.sender) {
    }
    
    function mintToken(address to, string memory uri) public onlyOwner returns(uint256){
        uint256 newItemId = _counter;
        _counter++;
        _safeMint(to,newItemId);
        _setTokenURI(newItemId , uri);
        return newItemId;
    }
}