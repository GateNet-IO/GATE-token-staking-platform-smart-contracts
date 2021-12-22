//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Staking.sol";

// compound once a day
contract Compound is Ownable {
    struct UserInfo {
        uint256 shares; // number of shares for a user
        uint256 stakeTime; // time of user deposit
        uint256 fee;
    }

    uint256 public totalStaked;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public lastUpdate;
    uint256 public shareWorth;
    IERC20 public stakedToken;
    Staking public staking;

    mapping(address => UserInfo[]) public userInfo;

    event Deposit(
        address indexed sender,
        uint256 amount,
        uint256 shares,
        uint256 lastDepositedTime
    );
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender);

    constructor(IERC20 _stakedToken, address _staking) {
        stakedToken = _stakedToken;
        staking = Staking(_staking);
    }

    function approve(uint256 amount) external onlyOwner {
        stakedToken.approve(address(staking), amount);
    }

    function deposit(uint256 amount) external updateShareWorth {
        require(amount > 0, "Nothing to deposit");
        userInfo[msg.sender].push(
            UserInfo(amount / shareWorth, block.timestamp, staking.feePerToken())
        );
        staking.autoCompStake(amount);
        stakedToken.transferFrom(msg.sender, address(staking), amount);
        //emit Deposit(msg.sender, amount, userInfo[msg.sender].shares, block.timestamp);
    }

    function withdrawAll() external {}

    function harvest() public {
        emit Harvest(msg.sender);
    }

    function withdraw(uint256 shares, uint256 index) public updateShareWorth {
        require(shares > 0, "Cannot unstake 0");
        require(shares <= userInfo[msg.sender][index].shares, "Stake too big");
        require(
            userInfo[msg.sender][index].stakeTime + staking.lockPeriod() <=
                block.timestamp
        );
        staking.autoCompUnstake(shares * shareWorth);
        staking.transferReward(shares * shareWorth, msg.sender);
        //emit Withdraw(msg.sender, currentAmount, _shares);
    }

    function available() public view returns (uint256) {}

    function balanceOf() public returns (uint256) {}

    function _earn() internal {}

    modifier updateShareWorth() {
        shareWorth *=
            1 +
            ((staking.lastTimeRewardApplicable() - staking.lastUpdateTime()) *
                staking.rewardRate() *
                1e18) /
            totalStaked;
        lastUpdateTime = staking.lastTimeRewardApplicable();
        _;
    }
}
