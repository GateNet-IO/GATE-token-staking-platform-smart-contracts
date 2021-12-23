//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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

    uint256 public minimumStake = 1000 ether;
    uint256 public lockPeriod = 31 days;

    uint256 public compounded;
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
        require(amount >= minimumStake, "Stake too small");
        require(!onlyCompoundStaking);
        totalStaked += amount;
        stakes[msg.sender].push(Stake(amount, block.timestamp, feePerToken));
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function claim() external started distributeReward(msg.sender) {
        uint256 reward = rewards[msg.sender];

        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            reward +=
                (stakes[msg.sender][i].amount / 1 ether) *
                (feePerToken - stakes[msg.sender][i].fee);
            stakes[msg.sender][i].fee = feePerToken;
        }

        reward += fees[msg.sender];
        fees[msg.sender] = 0;

        console.log(reward);

        if (reward > 0) {
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
            stakes[msg.sender][index].stakeTime + lockPeriod <= block.timestamp
        );
        require(!onlyCompoundStaking);
        totalStaked -= amount;
        stakes[msg.sender][index].amount -= amount;
        fees[msg.sender] +=
            (amount / 1 ether) *
            (feePerToken - stakes[msg.sender][index].fee);
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit Unstaked(msg.sender, amount, index);
    }

    function unstakeAll() external started {
        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            if (
                stakes[msg.sender][i].stakeTime + lockPeriod <= block.timestamp
            ) {
                unstake(stakes[msg.sender][i].amount, i);
            }
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function addFee(address user, uint256 amount) external onlyCompound {
        fees[user] += amount;
    }

    function addReward(uint256 amount) external onlyOwner {
        rewardRate += (amount) / (endDate - firstTimeRewardApplicable());
        stakedToken.transferFrom(msg.sender, address(this), amount);
    }

    function autoCompStake(uint256 amount) external onlyCompound {
        totalStaked += amount;
        compounded += amount;
        emit Staked(tx.origin, amount);
    }

    function autoCompUnstake(uint256 amount) external onlyCompound {
        totalStaked -= amount;
        compounded -= amount;
    }

    function transferReward(uint256 amount, address recipient)
        external
        onlyCompound
    {
        stakedToken.transferFrom(address(this), recipient, amount);
    }

    function setOnlyCompoundStaking(bool _onlyCompoundStaking)
        public
        onlyOwner
    {
        onlyCompoundStaking = _onlyCompoundStaking;
    }

    function setCompoundAddress(address _compound) public onlyOwner {
        compound = Compound(_compound);
    }

    function feeDistribution(uint256 amount) external onlyOwner {
        feePerToken += (amount * 1 ether) / (totalStaked - compounded);
        stakedToken.transferFrom(
            msg.sender,
            address(this),
            feePerToken * (totalStaked - compounded)
        );
        emit FeeDistributed(
            block.number,
            feePerToken * (totalStaked - compounded)
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
                (stakes[user][i].amount / 1 ether) *
                (feePerToken - stakes[user][i].fee);
        }

        return amount;
    }

    function getUserStakes(address user) public view returns (Stake[] memory) {
        return stakes[user];
    }

    function totalUserStakes(address _user) public view returns (uint256) {
        return stakes[_user].length;
    }

    /* ========== MODIFIERS ========== */

    modifier distributeReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = pendingReward(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier started() {
        require(block.timestamp >= beginDate);
        _;
    }

    modifier onlyCompound() {
        require(msg.sender == address(compound), "Staking::Only compound");
        _;
    }
}
