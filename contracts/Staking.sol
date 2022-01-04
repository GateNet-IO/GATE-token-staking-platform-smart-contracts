//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Compound.sol";
import "hardhat/console.sol";

contract Staking is Ownable {
    /* ========== STATE VARIABLES ========== */

    struct Stake {
        uint256 amount;
        uint256 stakeTime;
        uint256 fee;
    }

    uint256 public constant MINIMUM_STAKE = 1000 ether;
    uint256 public constant LOCK_PERIOD = 7 days;

    uint256 public totalStaked; // total amount of tokens staked
    uint256 public rewardRate; // token rewards per second
    uint256 public beginDate; // start date of rewards
    uint256 public endDate; // end date of rewards
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public feePerToken;
    bool public onlyCompoundStaking;
    Compound public compound; // compound contract address
    IERC20 public stakedToken; // token allowed to be staked

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public fees;
    mapping(address => Stake[]) public stakes;

    /* ========== EVENTS ========== */

    event Staked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event FeeDistributed(uint256 block, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 index);
    event RewardAdded(uint256 amount);

    /* ========== CONSTRUCTOR ========== */

    constructor(
        IERC20 _stakedToken,
        uint256 _beginDate,
        uint256 _endDate
    ) {
        stakedToken = _stakedToken;
        beginDate = _beginDate;
        endDate = _endDate;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount)
        external
        started
        distributeReward(msg.sender)
    {
        require(amount >= MINIMUM_STAKE, "Stake too small");
        require(!onlyCompoundStaking, "Only auto-compound staking allowed");
        totalStaked += amount;
        stakes[msg.sender].push(Stake(amount, block.timestamp, feePerToken));
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function claim() external started distributeReward(msg.sender) {
        uint256 reward = rewards[msg.sender];

        fees[msg.sender] = pendingFee(msg.sender);
        compound.calculateFees(msg.sender);

        reward += fees[msg.sender];

        if (reward > 0) {
            fees[msg.sender] = 0;
            rewards[msg.sender] = 0;
            stakedToken.transfer(msg.sender, reward);
            emit Claimed(msg.sender, reward);
        }
    }

    function unstake(uint256 amount, uint256 index)
        public
        started
        distributeReward(msg.sender)
    {
        require(amount > 0, "Cannot unstake 0");
        require(amount <= stakes[msg.sender][index].amount, "Stake too big");
        require(
            stakes[msg.sender][index].stakeTime + LOCK_PERIOD <=
                block.timestamp,
            "Minimum lock period hasn't passed"
        );

        totalStaked -= amount;
        stakes[msg.sender][index].amount -= amount;
        fees[msg.sender] +=
            ((amount) * (feePerToken - stakes[msg.sender][index].fee)) /
            1 ether;
        stakedToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, index);
    }

    function unstakeAll() external distributeReward(msg.sender) {
        uint256 totalAmount;
        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            if (
                stakes[msg.sender][i].stakeTime + LOCK_PERIOD <=
                block.timestamp &&
                stakes[msg.sender][i].amount > 0
            ) {
                uint256 amount = stakes[msg.sender][i].amount;
                totalAmount += amount;

                stakes[msg.sender][i].amount = 0;

                fees[msg.sender] +=
                    ((amount) * (feePerToken - stakes[msg.sender][i].fee)) /
                    1 ether;

                emit Unstaked(msg.sender, amount, i);
            }
        }
        totalStaked -= totalAmount;
        stakedToken.transfer(msg.sender, totalAmount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function addFee(address user, uint256 amount) external onlyCompound {
        fees[user] += amount;
    }

    function addReward(uint256 amount)
        external
        onlyOwner
        distributeReward(address(0))
    {
        require(amount > 0, "Cannot add 0 reward");
        rewardRate += (amount) / (endDate - firstTimeRewardApplicable());

        stakedToken.transferFrom(
            msg.sender,
            address(this),
            ((amount) / (endDate - firstTimeRewardApplicable())) *
                (endDate - firstTimeRewardApplicable())
        );

        emit RewardAdded(
            ((amount) / (endDate - firstTimeRewardApplicable())) *
                (endDate - firstTimeRewardApplicable())
        );
    }

    function autoCompStake(uint256 amount) external onlyCompound {
        totalStaked += amount;
        emit Staked(tx.origin, amount);
    }

    function autoCompUnstake(uint256 amount) external onlyCompound {
        totalStaked -= amount;
        emit Unstaked(tx.origin, amount, 0);
    }

    function transferReward(uint256 amount, address recipient)
        external
        onlyCompound
    {
        stakedToken.transfer(recipient, amount);
    }

    function setOnlyCompoundStaking(bool _onlyCompoundStaking)
        external
        onlyOwner
    {
        onlyCompoundStaking = _onlyCompoundStaking;
    }

    function setCompoundAddress(address _compound) external onlyOwner {
        compound = Compound(_compound);
    }

    function feeDistribution(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot distribute 0 fee");
        require(totalStaked > 0, "Noone to distribute fee to");

        feePerToken += (amount * 1 ether) / (totalStaked);

        stakedToken.transferFrom(
            msg.sender,
            address(this),
            (((amount * 1 ether) / (totalStaked)) * totalStaked) / 1 ether
        );

        emit FeeDistributed(
            block.timestamp,
            (((amount * 1 ether) / (totalStaked)) * totalStaked) / 1 ether
        );
    }

    /* ========== VIEWS ========== */

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < endDate ? block.timestamp : endDate;
    }

    function firstTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < beginDate ? beginDate : block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            ((lastTimeRewardApplicable() - lastUpdateTime) *
                rewardRate *
                1e18) /
            totalStaked;
    }

    function pendingReward(address user) public view returns (uint256) {
        uint256 amount;

        for (uint256 i = 0; i < stakes[user].length; i++) {
            amount += stakes[user][i].amount;
        }

        return
            (amount * (rewardPerToken() - (userRewardPerTokenPaid[user]))) /
            (1e18) +
            (rewards[user]);
    }

    function pendingFee(address user) public view returns (uint256) {
        uint256 amount = fees[user];

        for (uint256 i = 0; i < stakes[user].length; i++) {
            amount +=
                ((stakes[user][i].amount) *
                    (feePerToken - stakes[user][i].fee)) /
                1 ether;
        }

        return amount;
    }

    function getUserStakes(address user)
        external
        view
        returns (Stake[] memory)
    {
        return stakes[user];
    }

    function totalUserStakes(address _user) external view returns (uint256) {
        return stakes[_user].length;
    }

    /* ========== MODIFIERS ========== */

    modifier distributeReward(address account) {
        compound.harvest();
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = pendingReward(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier started() {
        require(block.timestamp >= beginDate, "Stake period hasn't started");
        _;
    }

    modifier onlyCompound() {
        require(msg.sender == address(compound), "Only compound");
        _;
    }
}
