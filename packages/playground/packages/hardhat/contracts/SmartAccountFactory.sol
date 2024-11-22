// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SmartAccount.sol";

contract SmartAccountFactory {
    address public immutable implementation;
    mapping(address owner => address[] accounts) public ownerAccounts;
    
    event AccountCreated(address indexed owner, address account);
    
    constructor(address _implementation) {
        implementation = _implementation;
    }
    
    function createAccount(
        uint256 threshold,
        uint256 period,
        address withdrawalAddress
    ) external returns (address) {
        address payable clone = payable(Clones.clone(implementation));
        SmartAccount(clone).initialize(msg.sender);
        
        // Initialize parameters
        SmartAccount(clone).setThreshold(threshold);
        SmartAccount(clone).setRedistributionPeriod(period);
        SmartAccount(clone).addStakeholder(withdrawalAddress, 100); // Default share of 100
        
        // Track the new account
        ownerAccounts[msg.sender].push(clone);
        
        emit AccountCreated(msg.sender, clone);
        return clone;
    }
    
    function getAccounts(address owner) external view returns (address[] memory) {
        return ownerAccounts[owner];
    }
}
