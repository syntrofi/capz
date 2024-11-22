// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CapzWallet is Initializable, ReentrancyGuard {
    address public owner;
    uint256 public threshold;
    uint256 public periodStart;
    uint256 public periodDuration;
    address public withdrawalAddress;
    
    uint256 public currentPeriodIncome;
    mapping(address => uint256) public stakeholderShares; // total shares = 100
    address[] public stakeholders;
    
    event FundsReceived(address indexed from, uint256 amount);
    event FundsForwarded(address indexed to, uint256 amount);
    event FundsRedistributed(uint256 amount, address[] stakeholders, uint256[] amounts);
    
    error OnlyOwner();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidShares();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    function initialize(
        address _owner,
        uint256 _threshold,
        uint256 _periodDuration,
        address _withdrawalAddress
    ) external initializer {
        if (_owner == address(0)) revert InvalidAddress();
        if (_withdrawalAddress == address(0)) revert InvalidAddress();
        if (_threshold == 0) revert InvalidAmount();
        
        owner = _owner;
        threshold = _threshold;
        periodDuration = _periodDuration;
        withdrawalAddress = _withdrawalAddress;
        periodStart = block.timestamp;
    }
    
    receive() external payable {
        _handleIncome(msg.value);
    }
    
    function _handleIncome(uint256 amount) internal {
        // Reset period if needed
        if (block.timestamp >= periodStart + periodDuration) {
            currentPeriodIncome = 0;
            periodStart = block.timestamp;
        }
        
        emit FundsReceived(msg.sender, amount);
        currentPeriodIncome += amount;
        
        // Forward funds up to threshold
        uint256 toForward = amount;
        if (currentPeriodIncome > threshold) {
            uint256 excess = currentPeriodIncome - threshold;
            toForward = amount - excess;
            if (toForward > 0) {
                _forwardFunds(toForward);
            }
            _redistribute(excess);
        } else {
            _forwardFunds(toForward);
        }
    }
    
    function _forwardFunds(uint256 amount) internal {
        (bool success, ) = withdrawalAddress.call{value: amount}("");
        require(success, "Forward failed");
        emit FundsForwarded(withdrawalAddress, amount);
    }
    
    function _redistribute(uint256 amount) internal {
        uint256 stakeholderCount = stakeholders.length;
        if (stakeholderCount == 0) {
            _forwardFunds(amount); // If no stakeholders, forward to owner
            return;
        }
        
        uint256[] memory amounts = new uint256[](stakeholderCount);
        uint256 totalDistributed = 0;
        
        // Calculate and send shares
        for (uint256 i = 0; i < stakeholderCount; i++) {
            address stakeholder = stakeholders[i];
            uint256 share = stakeholderShares[stakeholder];
            uint256 stakeholderAmount = (amount * share) / 100;
            amounts[i] = stakeholderAmount;
            totalDistributed += stakeholderAmount;
            
            (bool success, ) = stakeholder.call{value: stakeholderAmount}("");
            require(success, "Redistribution failed");
        }
        
        // Forward any dust amount to owner
        if (totalDistributed < amount) {
            _forwardFunds(amount - totalDistributed);
        }
        
        emit FundsRedistributed(amount, stakeholders, amounts);
    }
    
    function addStakeholder(address stakeholder, uint256 shares) external onlyOwner {
        if (stakeholder == address(0)) revert InvalidAddress();
        if (shares == 0 || shares > 100) revert InvalidShares();
        
        // Check total shares don't exceed 100
        uint256 totalShares = shares;
        for (uint256 i = 0; i < stakeholders.length; i++) {
            if (stakeholders[i] != stakeholder) {
                totalShares += stakeholderShares[stakeholders[i]];
            }
        }
        if (totalShares > 100) revert InvalidShares();
        
        if (stakeholderShares[stakeholder] == 0) {
            stakeholders.push(stakeholder);
        }
        stakeholderShares[stakeholder] = shares;
    }
}
