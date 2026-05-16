// SPDX-License-Identifier : MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {MyCollection} from "../src/MyCollection.sol";

contract MyCollectionTest is Test{

    MyCollection public myCollection;

    address public owner = makeAddr("ownerUser");

    function setUp()public{
        vm.prank(owner);
        myCollection = new MyCollection();
    }

    function testMintToken() public {
        // Arrange
        address tokenSendTo = makeAddr("tokenHolder");
        string memory uri = "http://example//ipfs.com";
        vm.prank(owner);

        // Act 
        uint256 newTokenid = myCollection.mintToken(tokenSendTo, uri);

        // Assert
        string memory setUri = myCollection.tokenURI(newTokenid);
        address ownerOfToken = myCollection.ownerOf(newTokenid);

        assertEq(newTokenid ,0, "Token Id not match with Expected Value");
        assertEq(setUri , uri , "URI is not match with Expected Result");
        assertEq(ownerOfToken,tokenSendTo , "Owner doesn't hold any Value");
    }
    function testRealMintToken() public {
        // Arrange
        address tokenSendTo = makeAddr("tokenHolder");
        string memory uri = "ipfs://bafkreih6hwfsyruhvhppyrkm36mdv6fjobxkoqojcwuyqeeksywane7yfu";
        vm.prank(owner);

        // Act 
        uint256 newTokenid = myCollection.mintToken(tokenSendTo, uri);

        // Assert
        string memory setUri = myCollection.tokenURI(newTokenid);
        address ownerOfToken = myCollection.ownerOf(newTokenid);

        assertEq(newTokenid ,0, "Token Id not match with Expected Value");
        assertEq(setUri , uri , "URI is not match with Expected Result");
        assertEq(ownerOfToken,tokenSendTo , "Owner doesn't hold any Value");
    }

}