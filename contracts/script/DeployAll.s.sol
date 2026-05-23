// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {Marketplace} from "../src/Marketplace.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        CollectionFactory factory     = new CollectionFactory();
        Marketplace       marketplace = new Marketplace(deployer);

        vm.stopBroadcast();

        console.log("CollectionFactory:", address(factory));
        console.log("Marketplace:      ", address(marketplace));
        console.log("Network: Sepolia");
        console.log("Deployer:", deployer);

        string memory json = string.concat(
            '{"sepolia":{"CollectionFactory":"',
            vm.toString(address(factory)),
            '","Marketplace":"',
            vm.toString(address(marketplace)),
            '"}}'
        );
        vm.writeJson(json, "./shared/addresses.json");
    }
}
