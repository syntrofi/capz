// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SmartAccount is Initializable, OwnableUpgradeable {
    uint256 public nextRedistributionTime;
    uint256 public redistributionPeriod;
    uint256 public threshold;
    address[] public stakeholders;
    mapping(address => uint256) public stakeholderShares;
    
    event RedistributionExecuted(uint256 amount, uint256 timestamp);
    event StakeholderAdded(address indexed stakeholder, uint256 share);
    event StakeholderRemoved(address indexed stakeholder);
    event ThresholdUpdated(uint256 newThreshold);
    event PeriodUpdated(uint256 newPeriod);
    
    error InvalidPeriod();
    error InvalidStakeholder();
    error InvalidShare();
    error StakeholderAlreadyExists();
    error StakeholderNotFound();
    error TooEarlyForRedistribution();
    error NoStakeholders();
    error BalanceBelowThreshold();
    error TransferFailed();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        redistributionPeriod = 1 days; // Default period
        nextRedistributionTime = block.timestamp + redistributionPeriod;
    }
    
    // Owner-only configuration functions
    function setThreshold(uint256 _threshold) external onlyOwner {
        threshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }
    
    function setRedistributionPeriod(uint256 _period) external onlyOwner {
        if(_period == 0) revert InvalidPeriod();
        redistributionPeriod = _period;
        nextRedistributionTime = block.timestamp + _period;
        emit PeriodUpdated(_period);
    }
    
    function addStakeholder(address stakeholder, uint256 share) external onlyOwner {
        if(stakeholder == address(0)) revert InvalidStakeholder();
        if(share == 0) revert InvalidShare();
        if(stakeholderShares[stakeholder] != 0) revert StakeholderAlreadyExists();
        
        stakeholders.push(stakeholder);
        stakeholderShares[stakeholder] = share;
        emit StakeholderAdded(stakeholder, share);
    }
    
    function removeStakeholder(address stakeholder) external onlyOwner {
        require(stakeholderShares[stakeholder] > 0, "Not a stakeholder");
        
        for (uint i = 0; i < stakeholders.length; i++) {
            if (stakeholders[i] == stakeholder) {
                stakeholders[i] = stakeholders[stakeholders.length - 1];
                stakeholders.pop();
                break;
            }
        }
        
        delete stakeholderShares[stakeholder];
        emit StakeholderRemoved(stakeholder);
    }
    
    // Public redistribution function - anyone can call
    function redistribute() public {
        require(block.timestamp >= nextRedistributionTime, "Too early for redistribution");
        require(stakeholders.length > 0, "No stakeholders");
        
        uint256 balance = address(this).balance;
        require(balance > threshold, "Balance below threshold");
        
        uint256 redistributionAmount = balance - threshold;
        
        // Calculate total shares
        uint256 totalShares = 0;
        for (uint i = 0; i < stakeholders.length; i++) {
            totalShares += stakeholderShares[stakeholders[i]];
        }
        
        // Distribute to stakeholders
        for (uint i = 0; i < stakeholders.length; i++) {
            address stakeholder = stakeholders[i];
            uint256 share = stakeholderShares[stakeholder];
            uint256 amount = (redistributionAmount * share) / totalShares;
            
            if (amount > 0) {
                (bool success, ) = stakeholder.call{value: amount}("");
                require(success, "Transfer failed");
            }
        }
        
        nextRedistributionTime = block.timestamp + redistributionPeriod;
        emit RedistributionExecuted(redistributionAmount, block.timestamp);
    }
    
    // View functions
    function getStakeholders() external view returns (address[] memory) {
        return stakeholders;
    }
    
    function canRedistribute() public view returns (bool) {
        return block.timestamp >= nextRedistributionTime &&
               address(this).balance > threshold &&
               stakeholders.length > 0;
    }
    
    receive() external payable {}
}
