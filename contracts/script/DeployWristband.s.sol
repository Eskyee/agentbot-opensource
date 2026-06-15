// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "forge-std/Script.sol";
import "../BaseFMDigitalWristband.sol";

contract DeployWristband is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        BaseFMDigitalWristband wristband = new BaseFMDigitalWristband(
            "baseFM Digital Wristband",   // name
            "bfmw",                        // symbol
            "https://agentbot.sh/api/wristband/metadata/", // baseURI
            vm.addr(deployerPrivateKey)    // initialOwner
        );
        
        vm.stopBroadcast();
        
        console.log("Wristband deployed at:", address(wristband));
        console.log("Owner:", vm.addr(deployerPrivateKey));
    }
}
