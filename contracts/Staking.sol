//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    struct Stake {
        uint256 amount;
        uint256 stakeTime;
        uint256 fee;
    }

    uint256 minimumStake = 1000 * 1e18;
    uint256 lockPeriod = 31 days;

    uint256 public totalStaked; // total amount of tokens staked
    uint256 public rewardRate; // token rewards per day
    uint256 public beginDate; // start date of rewards
    uint256 public endDate; // end date of rewards
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public feePerToken;
    address public compound; // compound contract address
    IERC20 public stakedToken; // token allowed to be staked

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public fees;
    mapping(address => Stake[]) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event FeeDistributed(uint256 block, uint256 amount);
    event FeesClaimed(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 index);

    constructor(
        address _compound,
        IERC20 _stakedToken,
        uint256 _beginDate,
        uint256 _endDate
    ) {
        compound = _compound;
        stakedToken = _stakedToken;
        beginDate = _beginDate;
        endDate = _endDate;
    }

    modifier started() {
        require(block.timestamp >= beginDate);
        _;
    }

    modifier onlyCompound() {
        require(msg.sender == compound, "Staking:: Only compound");
        _;
    }

    function feeDistribution(uint256 amount) external onlyOwner {
        feePerToken += amount / totalStaked;
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit FeeDistributed(block.number, amount);
    }

    function stake(uint256 amount)
        external
        started
        distributeReward(msg.sender)
    {
        require(amount >= minimumStake, "Stake too small");
        totalStaked += amount;
        stakes[msg.sender].push(Stake(amount, block.timestamp, feePerToken));
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function claim() external started distributeReward(msg.sender) {
        uint256 reward = rewards[msg.sender];

        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            reward += stakes[msg.sender][i].amount * (feePerToken - stakes[msg.sender][i].fee);
            stakes[msg.sender][i].fee = feePerToken;
        }

        reward += fees[msg.sender];
        fees[msg.sender] = 0;

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
            stakes[msg.sender][index].stakeTime + lockPeriod >= block.timestamp
        );
        totalStaked -= amount;
        stakes[msg.sender][index].amount -= amount;
        fees[msg.sender] += amount * (feePerToken - stakes[msg.sender][index].fee);
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

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < endDate ? block.timestamp : endDate;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (lastTimeRewardApplicable() -
                ((lastUpdateTime) * (rewardRate) * (1e18)) /
                (totalStaked));
    }

    function autoCompStake(uint256 _amount) external onlyCompound {}

    function autoCompUnstake(uint256 _amount) external onlyCompound {}

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
    }

    modifier distributeReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = pendingReward(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function setCompoundAddress(address _compound) public onlyOwner {
        compound = _compound;
    }

    function setOnlyCompoundStaking(bool _onlyCompoundStaking)
        public
        onlyOwner
    {}

    function getUserStakes(address user) public view returns (Stake[] memory) {
        return stakes[user];
    }

    function totalUserStakes(address _user) public view returns (uint256) {
        return stakes[_user].length;
    }
}
