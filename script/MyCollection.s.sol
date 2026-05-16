// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {MyCollection} from "../src/MyCollection.sol";
import {console} from "forge-std/console.sol";

contract MyCollectionScript is Script {
    function run() external{
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory nftURI = "ipfs://bafkreih6hwfsyruhvhppyrkm36mdv6fjobxkoqojcwuyqeeksywane7yfu";
        address tokenHolder = 0x49a18bd89ff0a50Bf780E5d7669F1c7384D19786;

        vm.startBroadcast(deployerPrivateKey);

        MyCollection deployedCollection = new MyCollection();
        console.log(address(deployedCollection));
        deployedCollection.mintToken(tokenHolder, nftURI);

        vm.stopBroadcast();
    }
 }