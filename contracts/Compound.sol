//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Staking.sol";

// compound once a day
contract Compound is Ownable {
    /* ========== STATE VARIABLES ========== */

    struct UserInfo {
        uint256 shareworth;
        uint256 shares; // number of shares for a user
        uint256 stakeTime; // time of user deposit
        uint256 fee;
    }

    uint256 public shareWorth;
    uint256 public lastUpdateTime;
    uint256 public shares;
    IERC20 public stakedToken;
    Staking public staking;

    mapping(address => UserInfo[]) public userInfo;

    /* ========== EVENTS ========== */

    event Deposit(
        address indexed sender,
        uint256 amount,
        uint256 shares,
        uint256 lastDepositedTime
    );
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender);

    /* ========== CONSTRUCTOR ========== */

    constructor(IERC20 _stakedToken, address _staking) {
        stakedToken = _stakedToken;
        staking = Staking(_staking);
        lastUpdateTime = staking.beginDate();
        shareWorth = 1;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function deposit(uint256 amount) external updateShareWorth {
        require(amount >= staking.minimumStake(), "Stake too small");
        shares += amount / shareWorth;
        userInfo[msg.sender].push(
            UserInfo(
                shareWorth,
                amount / shareWorth,
                block.timestamp,
                staking.feePerToken()
            )
        );
        staking.autoCompStake(amount);
        stakedToken.transferFrom(msg.sender, address(staking), amount);
        emit Deposit(
            msg.sender,
            amount,
            currentAmount(msg.sender),
            block.timestamp
        );
    }

    function withdrawAll() external {
        for (uint256 i = 0; i < userInfo[msg.sender].length; i++) {
            if (
                userInfo[msg.sender][i].stakeTime + staking.lockPeriod() <=
                block.timestamp
            ) {
                withdraw(userInfo[msg.sender][i].shares, i);
            }
        }
    }

    function withdraw(uint256 _shares, uint256 index) public updateShareWorth {
        require(shares > 0, "Cannot unstake 0");
        require(shares <= userInfo[msg.sender][index].shares, "Stake too big");
        require(
            userInfo[msg.sender][index].stakeTime + staking.lockPeriod() <=
                block.timestamp
        );
        shares -= _shares;
        userInfo[msg.sender][index].shares -= _shares;

        staking.addFee(
            msg.sender,
            _shares *
                userInfo[msg.sender][index].shareworth *
                (staking.feePerToken() - userInfo[msg.sender][index].fee)
        );

        staking.autoCompUnstake(_shares * shareWorth);
        staking.transferReward(_shares * shareWorth, msg.sender);
        emit Withdraw(msg.sender, currentAmount(msg.sender), _shares);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function approve(uint256 amount) external onlyOwner {
        stakedToken.approve(address(staking), amount);
    }

    function harvest() public updateShareWorth {
        emit Harvest(msg.sender);
    }

    /* ========== VIEWS ========== */

    function currentAmount(address user) public view returns (uint256) {
        uint256 amount;
        for (uint256 i = 0; i < userInfo[user].length; i++) {
            amount += userInfo[msg.sender][i].shares;
        }
        return amount;
    }

    function available() public view returns (uint256) {}

    function balanceOf() public returns (uint256) {}

    /* ========== MODIFIERS ========== */

    modifier updateShareWorth() {
        if (staking.totalStaked() > 0) {
            uint256 placeHolder = shareWorth;
            shareWorth *=
                1 +
                ((staking.lastTimeRewardApplicable() - lastUpdateTime) *
                    staking.rewardRate() *
                    1e18) /
                staking.totalStaked();

            lastUpdateTime = staking.lastTimeRewardApplicable();
            staking.autoCompStake(shares * (shareWorth - placeHolder));
        }
        _;
    }
}
