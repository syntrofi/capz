// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SmartAccount
 * @author Capz Protocol
 * @notice A non-extractive payment account that auto-forwards income below a threshold
 *         directly to the seller, and holds everything above it for redistribution.
 *
 * @dev Architecture:
 *   - EIP-1167 minimal proxy clone (initialized once, never re-initialized)
 *   - Instant forward: payments are split and forwarded immediately
 *   - Two redistribution modes: FIXED_LIST (defined stakeholders) or BUYERS (payers)
 *   - Economic params and payout address are timelocked to protect stakeholders
 *   - Gelato-compatible automation via checkUpkeep / performUpkeep
 */
contract SmartAccount is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public constant MAX_STAKEHOLDERS = 20;
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MAX_NAME_LENGTH = 100;
    uint256 public constant MIN_PERIOD = 1 days;
    uint256 public constant MAX_PERIOD = 366 days;
    uint256 public constant CHANGE_TIMELOCK = 2 days;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct Stakeholder {
        address recipient;
        uint16 shareBps;
    }

    enum BeneficiaryMode {
        FIXED_LIST,
        BUYERS
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storage (ordered as specified)
    // ─────────────────────────────────────────────────────────────────────────

    address public token;
    uint256 public threshold;
    uint256 public sellerOverflowBps;
    address public payoutAddress;
    BeneficiaryMode public beneficiaryMode;
    string public accountName;
    uint256 public currentPeriodId;
    uint256 public periodStart;
    uint256 public periodDuration;
    uint256 public periodIncome;
    uint256 public redistributionHeld;
    uint256 public sellerClaimable;
    Stakeholder[] public stakeholders;
    mapping(address => uint256) public claimableByStakeholder;
    mapping(uint256 => mapping(address => uint256)) public buyerContributions;
    mapping(uint256 => uint256) public periodTotalContributions;
    mapping(uint256 => uint256) public periodRedistributionPot;
    mapping(uint256 => mapping(address => bool)) public buyerHasClaimed;
    uint256 public pendingThreshold;
    uint256 public pendingSellerOverflowBps;
    uint256 public economicParamsChangeReadyAt;
    address public pendingPayoutAddress;
    uint256 public payoutAddressChangeReadyAt;
    Stakeholder[] private _pendingStakeholders;
    uint256 public stakeholdersChangeReadyAt;
    uint256 public pendingPeriodDuration;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event PaymentReceived(address indexed from, uint256 amount, uint256 periodTotal);
    event ForwardedToSeller(address indexed to, uint256 amount);
    event ForwardFailed(uint256 amount);
    event SellerClaimed(uint256 amount);
    event PeriodClosed(uint256 indexed periodId, uint256 closedAt, uint256 totalIncome, uint256 redistributionPot);
    event StakeholderClaimed(address indexed stakeholder, uint256 amount);
    event BuyerRedistributionClaimed(address indexed buyer, uint256 indexed periodId, uint256 amount);
    event EconomicParamsChangeQueued(uint256 newThreshold, uint256 newSellerOverflowBps, uint256 executableAt);
    event EconomicParamsChangeExecuted(uint256 threshold, uint256 sellerOverflowBps);
    event EconomicParamsChangeCancelled();
    event PayoutAddressChangeQueued(address indexed newAddress, uint256 executableAt);
    event PayoutAddressChangeExecuted(address indexed newAddress);
    event PayoutAddressChangeCancelled();
    event StakeholdersChangeQueued(uint256 executableAt);
    event StakeholdersChangeExecuted(Stakeholder[] newStakeholders);
    event StakeholdersChangeCancelled();
    event PeriodDurationQueued(uint256 newDuration);
    event PeriodDurationUpdated(uint256 newDuration);
    event AccountNameUpdated(string newName);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error InvalidThreshold();
    error InvalidSellerOverflowBps();
    error InvalidPayoutAddress();
    error InvalidPeriod();
    error InvalidStakeholder();
    error TooManyStakeholders();
    error SharesDoNotSumTo100();
    error DuplicateStakeholder();
    error NothingToWithdraw();
    error PeriodNotYetOver();
    error ChangePending();
    error NoChangePending();
    error ChangeNotReady();
    error WrongToken();
    error ETHTransferFailed();
    error NotInitialized();
    error WrongMode();
    error AlreadyClaimed();
    error PeriodNotClosed();
    error NameTooLong();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Initialize a new SmartAccount clone. Called once by the factory.
     * @param _owner              The account owner
     * @param _payoutAddress      Address that receives seller's forwarded payments
     * @param _threshold          Soft cap per period (in token units)
     * @param _sellerOverflowBps  Seller's marginal retention above threshold (0–10000)
     * @param _periodDuration     Period length in seconds
     * @param _token              ERC20 token, or address(0) for ETH
     * @param _beneficiaryMode    FIXED_LIST or BUYERS
     * @param _stakeholders       Stakeholder list (required for FIXED_LIST, must be empty for BUYERS)
     * @param _accountName        Human-readable name
     */
    function initialize(
        address _owner,
        address _payoutAddress,
        uint256 _threshold,
        uint256 _sellerOverflowBps,
        uint256 _periodDuration,
        address _token,
        BeneficiaryMode _beneficiaryMode,
        Stakeholder[] calldata _stakeholders,
        string calldata _accountName
    ) external initializer {
        if (_threshold == 0) revert InvalidThreshold();
        if (_sellerOverflowBps > BASIS_POINTS) revert InvalidSellerOverflowBps();
        if (_payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (_periodDuration < MIN_PERIOD || _periodDuration > MAX_PERIOD) revert InvalidPeriod();
        if (bytes(_accountName).length > MAX_NAME_LENGTH) revert NameTooLong();

        if (_beneficiaryMode == BeneficiaryMode.FIXED_LIST) {
            if (_stakeholders.length == 0 || _stakeholders.length > MAX_STAKEHOLDERS)
                revert TooManyStakeholders();
            _validateStakeholders(_stakeholders);
            for (uint256 i = 0; i < _stakeholders.length; ) {
                stakeholders.push(_stakeholders[i]);
                unchecked { ++i; }
            }
        } else {
            // BUYERS mode: stakeholders list must be empty
            if (_stakeholders.length != 0) revert TooManyStakeholders();
        }

        __Ownable_init(_owner);
        __Pausable_init();

        token = _token;
        threshold = _threshold;
        sellerOverflowBps = _sellerOverflowBps;
        payoutAddress = _payoutAddress;
        beneficiaryMode = _beneficiaryMode;
        periodDuration = _periodDuration;
        periodStart = block.timestamp;
        accountName = _accountName;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Payment reception
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Receive native ETH payments.
     */
    receive() external payable nonReentrant whenNotPaused {
        if (owner() == address(0)) revert NotInitialized();
        if (token != address(0)) revert WrongToken();
        _processPayment(msg.sender, msg.value);
    }

    /**
     * @notice Deposit ERC20 tokens. Fee-on-transfer safe.
     * @param amount Amount to pull from caller (credited amount may be less with FOT tokens)
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (token == address(0)) revert WrongToken();
        if (amount == 0) revert InvalidThreshold();

        IERC20 tokenContract = IERC20(token);
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = tokenContract.balanceOf(address(this)) - balanceBefore;

        _processPayment(msg.sender, received);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seller escape hatch
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Claim any ETH that failed to forward automatically.
     * @dev    Only accumulates if the payoutAddress rejected ETH. Owner recovers to current payoutAddress.
     */
    function sellerClaim() external onlyOwner nonReentrant {
        uint256 amount = sellerClaimable;
        if (amount == 0) revert NothingToWithdraw();
        sellerClaimable = 0;
        _sendETH(payoutAddress, amount);
        emit SellerClaimed(amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Stakeholder / buyer claims
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Claim accumulated redistribution for a FIXED_LIST stakeholder.
     * @dev    Intentionally NOT whenNotPaused — earned funds remain accessible.
     */
    function stakeholderClaim() external nonReentrant {
        if (beneficiaryMode != BeneficiaryMode.FIXED_LIST) revert WrongMode();
        uint256 amount = claimableByStakeholder[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        claimableByStakeholder[msg.sender] = 0;
        _transfer(msg.sender, amount);
        emit StakeholderClaimed(msg.sender, amount);
    }

    /**
     * @notice Claim proportional redistribution for a buyer in a closed period.
     * @dev    Intentionally NOT whenNotPaused — earned funds remain accessible.
     * @param pid The period ID to claim from (must be a closed period)
     */
    function claimBuyerRedistribution(uint256 pid) external nonReentrant {
        if (beneficiaryMode != BeneficiaryMode.BUYERS) revert WrongMode();
        if (pid >= currentPeriodId) revert PeriodNotClosed();
        if (buyerHasClaimed[pid][msg.sender]) revert AlreadyClaimed();

        uint256 contribution = buyerContributions[pid][msg.sender];
        if (contribution == 0) revert NothingToWithdraw();

        uint256 pot = periodRedistributionPot[pid];
        uint256 totalContribs = periodTotalContributions[pid];

        buyerHasClaimed[pid][msg.sender] = true;

        uint256 share = (pot * contribution) / totalContribs;
        if (share == 0) revert NothingToWithdraw();

        _transfer(msg.sender, share);
        emit BuyerRedistributionClaimed(msg.sender, pid, share);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Period management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Close the current period and settle redistribution.
     * @dev    Callable by anyone (owner, Gelato, keeper bots).
     */
    function closePeriod() public nonReentrant whenNotPaused {
        if (block.timestamp < periodStart + periodDuration) revert PeriodNotYetOver();

        uint256 pid = currentPeriodId;
        uint256 income = periodIncome;
        uint256 held = redistributionHeld;

        if (beneficiaryMode == BeneficiaryMode.FIXED_LIST) {
            if (held > 0) {
                _distributeToStakeholders(held);
            }
        } else {
            // BUYERS mode: snapshot the pot and total contributions
            periodRedistributionPot[pid] = held;
            periodTotalContributions[pid] = income;
        }

        // Apply pending period duration if queued
        if (pendingPeriodDuration != 0) {
            periodDuration = pendingPeriodDuration;
            pendingPeriodDuration = 0;
            emit PeriodDurationUpdated(periodDuration);
        }

        // Advance period
        currentPeriodId = pid + 1;
        periodStart = block.timestamp;
        periodIncome = 0;
        redistributionHeld = 0;

        emit PeriodClosed(pid, block.timestamp, income, held);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gelato automation compatibility
    // ─────────────────────────────────────────────────────────────────────────

    function checkUpkeep(bytes calldata)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = block.timestamp >= periodStart + periodDuration && !paused();
        performData = "";
    }

    function performUpkeep(bytes calldata) external {
        closePeriod();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Economic params timelock
    // ─────────────────────────────────────────────────────────────────────────

    function queueEconomicParamsChange(uint256 newThreshold, uint256 newSellerOverflowBps)
        external
        onlyOwner
    {
        if (newThreshold == 0) revert InvalidThreshold();
        if (newSellerOverflowBps > BASIS_POINTS) revert InvalidSellerOverflowBps();
        if (economicParamsChangeReadyAt != 0) revert ChangePending();

        pendingThreshold = newThreshold;
        pendingSellerOverflowBps = newSellerOverflowBps;
        economicParamsChangeReadyAt = block.timestamp + CHANGE_TIMELOCK;

        emit EconomicParamsChangeQueued(newThreshold, newSellerOverflowBps, economicParamsChangeReadyAt);
    }

    function executeEconomicParamsChange() external onlyOwner {
        if (economicParamsChangeReadyAt == 0) revert NoChangePending();
        if (block.timestamp < economicParamsChangeReadyAt) revert ChangeNotReady();

        threshold = pendingThreshold;
        sellerOverflowBps = pendingSellerOverflowBps;
        pendingThreshold = 0;
        pendingSellerOverflowBps = 0;
        economicParamsChangeReadyAt = 0;

        emit EconomicParamsChangeExecuted(threshold, sellerOverflowBps);
    }

    function cancelEconomicParamsChange() external onlyOwner {
        if (economicParamsChangeReadyAt == 0) revert NoChangePending();

        pendingThreshold = 0;
        pendingSellerOverflowBps = 0;
        economicParamsChangeReadyAt = 0;

        emit EconomicParamsChangeCancelled();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Payout address timelock
    // ─────────────────────────────────────────────────────────────────────────

    function queuePayoutAddressChange(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidPayoutAddress();
        if (payoutAddressChangeReadyAt != 0) revert ChangePending();

        pendingPayoutAddress = newAddress;
        payoutAddressChangeReadyAt = block.timestamp + CHANGE_TIMELOCK;

        emit PayoutAddressChangeQueued(newAddress, payoutAddressChangeReadyAt);
    }

    function executePayoutAddressChange() external onlyOwner {
        if (payoutAddressChangeReadyAt == 0) revert NoChangePending();
        if (block.timestamp < payoutAddressChangeReadyAt) revert ChangeNotReady();

        payoutAddress = pendingPayoutAddress;
        pendingPayoutAddress = address(0);
        payoutAddressChangeReadyAt = 0;

        emit PayoutAddressChangeExecuted(payoutAddress);
    }

    function cancelPayoutAddressChange() external onlyOwner {
        if (payoutAddressChangeReadyAt == 0) revert NoChangePending();

        pendingPayoutAddress = address(0);
        payoutAddressChangeReadyAt = 0;

        emit PayoutAddressChangeCancelled();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Stakeholders timelock (FIXED_LIST only)
    // ─────────────────────────────────────────────────────────────────────────

    function queueStakeholdersChange(Stakeholder[] calldata newStakeholders) external onlyOwner {
        if (beneficiaryMode != BeneficiaryMode.FIXED_LIST) revert WrongMode();
        if (newStakeholders.length == 0 || newStakeholders.length > MAX_STAKEHOLDERS)
            revert TooManyStakeholders();
        if (stakeholdersChangeReadyAt != 0) revert ChangePending();

        _validateStakeholders(newStakeholders);

        delete _pendingStakeholders;
        for (uint256 i = 0; i < newStakeholders.length; ) {
            _pendingStakeholders.push(newStakeholders[i]);
            unchecked { ++i; }
        }

        stakeholdersChangeReadyAt = block.timestamp + CHANGE_TIMELOCK;
        emit StakeholdersChangeQueued(stakeholdersChangeReadyAt);
    }

    function executeStakeholdersChange() external onlyOwner {
        if (stakeholdersChangeReadyAt == 0) revert NoChangePending();
        if (block.timestamp < stakeholdersChangeReadyAt) revert ChangeNotReady();

        delete stakeholders;
        uint256 len = _pendingStakeholders.length;
        for (uint256 i = 0; i < len; ) {
            stakeholders.push(_pendingStakeholders[i]);
            unchecked { ++i; }
        }

        delete _pendingStakeholders;
        stakeholdersChangeReadyAt = 0;

        emit StakeholdersChangeExecuted(stakeholders);
    }

    function cancelStakeholdersChange() external onlyOwner {
        if (stakeholdersChangeReadyAt == 0) revert NoChangePending();

        delete _pendingStakeholders;
        stakeholdersChangeReadyAt = 0;

        emit StakeholdersChangeCancelled();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Period duration (deferred)
    // ─────────────────────────────────────────────────────────────────────────

    function updatePeriodDuration(uint256 newDuration) external onlyOwner {
        if (newDuration < MIN_PERIOD || newDuration > MAX_PERIOD) revert InvalidPeriod();
        pendingPeriodDuration = newDuration;
        emit PeriodDurationQueued(newDuration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Misc owner config
    // ─────────────────────────────────────────────────────────────────────────

    function updateAccountName(string calldata newName) external onlyOwner {
        if (bytes(newName).length > MAX_NAME_LENGTH) revert NameTooLong();
        accountName = newName;
        emit AccountNameUpdated(newName);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    function getStakeholders() external view returns (Stakeholder[] memory) {
        return stakeholders;
    }

    function getPendingStakeholders() external view returns (Stakeholder[] memory) {
        return _pendingStakeholders;
    }

    function getClaimable(address stakeholder) external view returns (uint256) {
        return claimableByStakeholder[stakeholder];
    }

    function getBuyerContribution(uint256 pid, address buyer) external view returns (uint256) {
        return buyerContributions[pid][buyer];
    }

    function getPeriodRedistributionInfo(uint256 pid)
        external
        view
        returns (uint256 pot, uint256 totalContribs)
    {
        pot = periodRedistributionPot[pid];
        totalContribs = periodTotalContributions[pid];
    }

    /**
     * @notice Full status of the current period.
     * @return id            Current period ID
     * @return start         Period start timestamp
     * @return end           Period end timestamp
     * @return income        Total income received this period
     * @return held          Redistribution held so far this period
     * @return timeRemaining Seconds until period can be closed (0 if ready)
     */
    function getPeriodStatus()
        external
        view
        returns (
            uint256 id,
            uint256 start,
            uint256 end,
            uint256 income,
            uint256 held,
            uint256 timeRemaining
        )
    {
        id = currentPeriodId;
        start = periodStart;
        end = periodStart + periodDuration;
        income = periodIncome;
        held = redistributionHeld;
        uint256 periodEnd = periodStart + periodDuration;
        timeRemaining = block.timestamp >= periodEnd ? 0 : periodEnd - block.timestamp;
    }

    function getBalance() external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Core payment logic: compute split, update accounting, forward to seller.
     */
    function _processPayment(address from, uint256 amount) internal {
        (uint256 forwardAmount, uint256 holdAmount) = _computeSplit(amount);

        periodIncome += amount;
        redistributionHeld += holdAmount;

        if (beneficiaryMode == BeneficiaryMode.BUYERS && amount > 0) {
            buyerContributions[currentPeriodId][from] += amount;
        }

        emit PaymentReceived(from, amount, periodIncome);

        if (forwardAmount > 0) {
            _forwardToSeller(forwardAmount);
        }
    }

    /**
     * @dev Compute the split between what to forward to seller and what to hold.
     *      Three cases:
     *        1. Fully below threshold (considering existing periodIncome before this payment)
     *        2. Fully above threshold
     *        3. Straddles the threshold
     */
    function _computeSplit(uint256 amount)
        internal
        view
        returns (uint256 forwardAmount, uint256 holdAmount)
    {
        uint256 prevIncome = periodIncome; // before this payment is added
        uint256 cap = threshold;

        if (prevIncome >= cap) {
            // Case 2: already above threshold — split the whole amount
            uint256 sellerPart = (amount * sellerOverflowBps) / BASIS_POINTS;
            forwardAmount = sellerPart;
            holdAmount = amount - sellerPart;
        } else if (prevIncome + amount <= cap) {
            // Case 1: fully below threshold
            forwardAmount = amount;
            holdAmount = 0;
        } else {
            // Case 3: straddles threshold
            uint256 belowPart = cap - prevIncome;
            uint256 abovePart = amount - belowPart;
            uint256 sellerAbovePart = (abovePart * sellerOverflowBps) / BASIS_POINTS;
            forwardAmount = belowPart + sellerAbovePart;
            holdAmount = abovePart - sellerAbovePart;
        }
    }

    /**
     * @dev Forward ETH or ERC20 to seller's payoutAddress.
     *      For ETH: if the forward fails, accumulate in sellerClaimable.
     *      For ERC20: safeTransfer (reverts on failure — no graceful fallback possible).
     */
    function _forwardToSeller(uint256 amount) internal {
        if (token == address(0)) {
            // ETH forward
            (bool ok, ) = payoutAddress.call{value: amount}("");
            if (ok) {
                emit ForwardedToSeller(payoutAddress, amount);
            } else {
                sellerClaimable += amount;
                emit ForwardFailed(amount);
            }
        } else {
            IERC20(token).safeTransfer(payoutAddress, amount);
            emit ForwardedToSeller(payoutAddress, amount);
        }
    }

    /**
     * @dev Distribute `total` among FIXED_LIST stakeholders proportionally.
     *      Last stakeholder absorbs rounding dust.
     */
    function _distributeToStakeholders(uint256 total) internal {
        uint256 len = stakeholders.length;
        uint256 distributed = 0;

        for (uint256 i = 0; i < len - 1; ) {
            uint256 share = (total * stakeholders[i].shareBps) / BASIS_POINTS;
            claimableByStakeholder[stakeholders[i].recipient] += share;
            distributed += share;
            unchecked { ++i; }
        }

        uint256 lastShare = total - distributed;
        claimableByStakeholder[stakeholders[len - 1].recipient] += lastShare;
    }

    /**
     * @dev Validate a proposed stakeholder list: no zero addr, no zero share,
     *      no duplicates, shares sum to BASIS_POINTS.
     */
    function _validateStakeholders(Stakeholder[] calldata inputs) internal pure {
        uint256 len = inputs.length;
        uint256 totalShares = 0;

        for (uint256 i = 0; i < len; ) {
            if (inputs[i].recipient == address(0)) revert InvalidStakeholder();
            if (inputs[i].shareBps == 0) revert InvalidStakeholder();

            for (uint256 j = i + 1; j < len; ) {
                if (inputs[i].recipient == inputs[j].recipient) revert DuplicateStakeholder();
                unchecked { ++j; }
            }

            totalShares += inputs[i].shareBps;
            unchecked { ++i; }
        }

        if (totalShares != BASIS_POINTS) revert SharesDoNotSumTo100();
    }

    /**
     * @dev Transfer ETH or ERC20 to recipient.
     */
    function _transfer(address to, uint256 amount) internal {
        if (token == address(0)) {
            _sendETH(to, amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Low-level ETH send that reverts on failure.
     */
    function _sendETH(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert ETHTransferFailed();
    }
}
