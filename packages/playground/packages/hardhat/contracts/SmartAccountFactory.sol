// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SmartAccount.sol";

contract SmartAccountFactory {
    address public immutable implementation;
    mapping(address owner => address[] accounts) public ownerAccounts;
    
    event AccountCreated(address indexed owner, address account);
    event CloneCreated(address indexed clone);
    event InitializationStarted(address indexed clone);
    event ThresholdSet(address indexed clone, uint256 threshold);
    event PeriodSet(address indexed clone, uint256 period);
    event StakeholderAdded(address indexed clone, address stakeholder, uint256 share);
    
    error InvalidImplementation();
    error InvalidThreshold();
    error InvalidPeriod();
    error InvalidWithdrawalAddress();
    
    constructor(address _implementation) {
        if(_implementation == address(0)) revert InvalidImplementation();
        implementation = _implementation;
    }
    
    function createAccount(
        uint256 threshold,
        uint256 period,
        address withdrawalAddress
    ) external returns (address) {
        if(threshold == 0) revert InvalidThreshold();
        if(period == 0) revert InvalidPeriod();
        if(withdrawalAddress == address(0)) revert InvalidWithdrawalAddress();
        
        // Clone the implementation
        address payable clone = payable(Clones.clone(implementation));
        emit CloneCreated(clone);
        
        // Initialize with all parameters
        try SmartAccount(clone).initialize(
            msg.sender,
            threshold,
            period,
            withdrawalAddress
        ) {
            ownerAccounts[msg.sender].push(clone);
            emit AccountCreated(msg.sender, clone);
            return clone;
        } catch Error(string memory reason) {
            revert(string.concat("Failed to initialize: ", reason));
        } catch {
            revert("Failed to initialize (no reason)");
        }
    }
    
    function getAccounts(address owner) external view returns (address[] memory) {
        return ownerAccounts[owner];
    }
}
