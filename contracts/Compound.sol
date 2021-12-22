//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStaking.sol";

contract Compound is Ownable {
    struct UserInfo {
        uint256 shares; // number of shares for a user
        uint256 stakeTime; // timestamp of user deposit
    }

    IERC20 public stakedToken;
    IStaking public staking;
    mapping(address => UserInfo[]) public userInfo;

    event Deposit(
        address indexed sender,
        uint256 amount,
        uint256 shares,
        uint256 lastDepositedTime
    );
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender);

    constructor(IERC20 _stakedToken, IStaking _staking) {
        stakedToken = _stakedToken;
        staking = _staking;
    }

    function approve(uint256 _amount) external onlyOwner {
        stakedToken.approve(address(staking), _amount);
    }

    function deposit(uint256 _amount) external {
        require(_amount > 0, "Nothing to deposit");
        //emit Deposit(msg.sender, _amount, currentShares, block.timestamp);
    }

    function withdrawAll() external {}

    function harvest() public {
        emit Harvest(msg.sender);
    }

    function withdraw(uint256 _shares) public {
        //emit Withdraw(msg.sender, currentAmount, _shares);
    }

    function available() public view returns (uint256) {}

    function balanceOf() public returns (uint256) {}

    function _earn() internal {}
}
