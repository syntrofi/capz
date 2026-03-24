// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SmartAccount.sol";

/**
 * @title SmartAccountFactory
 * @author Capz Protocol
 * @notice Deploys SmartAccount clones using EIP-1167 minimal proxy pattern.
 *         Each clone is gas-efficient (~45k gas to deploy vs ~500k+ for a full deploy).
 *         The factory tracks all accounts per owner for easy frontend enumeration.
 *
 * @dev The factory is itself owned (by the Capz team) to allow pausing account
 *      creation in emergencies. Individual SmartAccounts are owned by their creators.
 */
contract SmartAccountFactory is Ownable {
    using Clones for address;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public immutable implementation;
    mapping(address => address[]) private _ownerAccounts;
    address[] private _allAccounts;
    bool public creationPaused;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event AccountCreated(
        address indexed owner,
        address indexed account,
        uint256 threshold,
        uint256 periodDuration,
        address token,
        string accountName
    );

    event CreationPausedUpdated(bool paused);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error InvalidImplementation();
    error CreationIsPaused();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _implementation, address _owner) Ownable(_owner) {
        if (_implementation == address(0)) revert InvalidImplementation();
        implementation = _implementation;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Account creation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new SmartAccount clone for the caller.
     * @param payoutAddress      Address that receives seller's forwarded payments
     * @param threshold          Soft cap per period (in token units)
     * @param sellerOverflowBps  Seller's marginal retention above threshold (0–10000)
     * @param periodDuration     Period length in seconds
     * @param token              ERC20 token address, or address(0) for ETH
     * @param beneficiaryMode    FIXED_LIST or BUYERS
     * @param stakeholders       Stakeholder list (non-empty for FIXED_LIST, empty for BUYERS)
     * @param accountName        Human-readable name
     * @return account           The address of the newly deployed SmartAccount clone
     */
    function createAccount(
        address payoutAddress,
        uint256 threshold,
        uint256 sellerOverflowBps,
        uint256 periodDuration,
        address token,
        SmartAccount.BeneficiaryMode beneficiaryMode,
        SmartAccount.Stakeholder[] calldata stakeholders,
        string calldata accountName
    ) external returns (address account) {
        if (creationPaused) revert CreationIsPaused();

        account = implementation.clone();

        SmartAccount(payable(account)).initialize(
            msg.sender,
            payoutAddress,
            threshold,
            sellerOverflowBps,
            periodDuration,
            token,
            beneficiaryMode,
            stakeholders,
            accountName
        );

        _ownerAccounts[msg.sender].push(account);
        _allAccounts.push(account);

        emit AccountCreated(
            msg.sender,
            account,
            threshold,
            periodDuration,
            token,
            accountName
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    function getAccountsByOwner(address owner) external view returns (address[] memory) {
        return _ownerAccounts[owner];
    }

    function getAccountCountByOwner(address owner) external view returns (uint256) {
        return _ownerAccounts[owner].length;
    }

    function getAllAccounts() external view returns (address[] memory) {
        return _allAccounts;
    }

    function getTotalAccounts() external view returns (uint256) {
        return _allAccounts.length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    function setCreationPaused(bool _paused) external onlyOwner {
        creationPaused = _paused;
        emit CreationPausedUpdated(_paused);
    }
}
