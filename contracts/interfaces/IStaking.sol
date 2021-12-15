// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStaking {
    struct Stake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 feeDebt;
        uint256 stakeTime;
    }

    function stake(uint256) external;

    function stakes(address, uint256)
        external
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );

    function claim() external;

    function unstake(uint256, uint256) external;

    function getReward(uint256, uint256) external view returns (uint256);

    function pendingReward(address) external view returns (uint256);

    function distributeReward() external;

    function autoCompStake(uint256) external;

    function autoCompUnstake(uint256) external;

    function getUserStakes(address) external returns (Stake[] memory);
}
