// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./CapzWallet.sol";

contract CapzFactory {
    address public immutable implementation;
    address public owner;
    
    mapping(address => address[]) public userWallets;
    
    event WalletCreated(address indexed owner, address wallet);
    
    error OnlyOwner();
    error InvalidImplementation();
    
    constructor(address _implementation) {
        if (_implementation == address(0)) revert InvalidImplementation();
        implementation = _implementation;
        owner = msg.sender;
    }
    
    function createWallet(
        uint256 threshold,
        uint256 periodDuration,
        address withdrawalAddress
    ) external returns (address payable wallet) {
        wallet = payable(Clones.clone(implementation));
        
        CapzWallet(wallet).initialize(
            msg.sender,
            threshold,
            periodDuration,
            withdrawalAddress
        );
        
        userWallets[msg.sender].push(wallet);
        emit WalletCreated(msg.sender, wallet);
    }
    
    function getWallets(address user) external view returns (address[] memory) {
        return userWallets[user];
    }
}
