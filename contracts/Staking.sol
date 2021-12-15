//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    struct Stake {
        uint256 amount;
        uint256 unstaked;
        uint256 stakeTime;
        uint256 reward;
    }

    struct Fee {
        uint256 perStake;
        uint256 time;
    }

    uint256 minimumStake = 1000 * 1e18;
    uint256 lockPeriod = 31 days;

    uint256 public totalStaked; // total amount of tokens staked
    uint256 public rewardPerDay; // token rewards per block
    uint256 public beginDate; // start date of rewards
    uint256 public endDate; // end date of rewards
    address public compound; // compound contract address
    IERC20 public stakedToken; // token allowed to be staked
    mapping(address => Stake[]) stakes;
    Fee[] public fees;

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

    modifier onlyCompound() {
        require(msg.sender == compound, "Staking:: Only compound");
        _;
    }

    function feeDistribution(uint256 amount) external onlyOwner {
        fees.push(Fee(amount / totalStaked, block.timestamp));
        emit FeeDistributed(block.number, amount);
    }

    function stake(uint256 amount) external {
        require(amount >= minimumStake, "Stake too small");
        totalStaked += amount;
        stakes[msg.sender].push(Stake(amount, 0, block.timestamp, 0));
        stakedToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function claim() external {
        //emit Claimed(msg.sender, pending + feeReward);
    }

    function unstake(uint256 amount, uint256 index) public {
        require(
            stakes[msg.sender][index].amount >= amount,
            "Not enough staked tokens"
        );
        require(
            stakes[msg.sender][index].stakeTime + lockPeriod <= block.timestamp,
            "Stake needs to be locked for a minimum period of time"
        );

        uint256 trueEnd;
        if (block.timestamp >= endDate) {
            trueEnd = endDate;
        } else {
            trueEnd = block.timestamp;
        }

        stakes[msg.sender][index].reward +=
            amount *
            getReward(stakes[msg.sender][index].stakeTime, block.timestamp);
        stakes[msg.sender][index].amount -= amount;

        totalStaked -= amount;

        stakedToken.transferFrom(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount, index);
    }

    function unstakeAll() external {
        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            if (
                stakes[msg.sender][i].stakeTime + lockPeriod <= block.timestamp
            ) {
                unstake(stakes[msg.sender][i].amount, i);
            }
        }
    }

    function autoCompStake(uint256 _amount) external onlyCompound {}

    function autoCompUnstake(uint256 _amount) external onlyCompound {}

    function getReward(uint256 from, uint256 to) public view returns (uint256) {
        return to - from * 1 days * rewardPerDay;
    }

    function pendingReward(address _user) public view returns (uint256) {
        uint256 amount;
        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            amount +=
                stakes[msg.sender][i].amount *
                getReward(block.timestamp, stakes[msg.sender][i].stakeTime);
            amount += stakes[msg.sender][i].reward;
        }
    }

    function pendingFee(address user) public view returns (uint256) {
        uint256 amount;
        for (uint256 x = 0; x < fees.length; x++) {
            for (uint256 y = 0; y < stakes[msg.sender].length; y++) {
                if (fees[x].time < stakes[msg.sender][y].stakeTime) {
                    amount += stakes[msg.sender][y].amount * fees[x].perStake;
                    amount += stakes[msg.sender][y].unstaked * fees[x].perStake;
                }
            }
        }
        return amount;
    }

    function distributeReward() public {}

    function setCompoundAddress(address _compound) public onlyOwner {
        compound = _compound;
    }

    function setOnlyCompoundStaking(bool _onlyCompoundStaking)
        public
        onlyOwner
    {}

    function safeRewardTransfer(address _to, uint256 _amount) internal {}

    function getUserStakes(address user) public view returns (Stake[] memory) {
        return stakes[user];
    }

    function totalUserStakes(address _user) public view returns (uint256) {
        return stakes[_user].length;
    }
}
