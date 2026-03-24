// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../SmartAccount.sol";

/**
 * @title ReentrancyAttacker
 * @notice Test contract that attempts to exploit reentrancy in SmartAccount.stakeholderClaim().
 * @dev    Used in the test suite to verify that ReentrancyGuard prevents double-claims.
 *         DO NOT deploy to production.
 */
contract ReentrancyAttacker {
    SmartAccount public target;
    uint256 public attackCount;

    function setTarget(address _target) external {
        target = SmartAccount(payable(_target));
    }

    /// @notice Initiate the reentrancy attack by calling stakeholderClaim
    function attack() external {
        target.stakeholderClaim();
    }

    /// @notice Re-enter stakeholderClaim on receipt of ETH
    receive() external payable {
        attackCount++;
        if (attackCount < 3 && address(target).balance > 0) {
            target.stakeholderClaim();
        }
    }
}
