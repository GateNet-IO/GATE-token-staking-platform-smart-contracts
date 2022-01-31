# GATE Token Staking Platform Smart Contracts

Staking/Rewards and Governance Platform

## .env file
ETHERSCAN_API: get at etherscan.com<br />
PRIVATE_KEY: ethereum wallet private key<br />
ALCHEMY_URL: infura / alchemy url

## compiling smart contracts
```npx hardhat compile```

## code coverage
```npx hardhat coverage```

# Staking Platform Functionality
## Staking:
There is an ability for a staker wishing to stake, to deposit their tokens with the smart contract.
## Staking Rewards:
The primary function of the smart contract is to distribute staking rewards to users that stake their GATE tokens. The smart contract will be funded (addReward) with 36,500,000 GATE tokens. At the rewards start date, these tokens will start being distributed to stakers over a 365 day period (100,000 GATE tokens per day).
## Fee Distribution:
There is a function built in (feeDistribution), whereby a periodic award of GATE tokens is distributed to stakers, as a percentage of their stake vs total stake, who are currently staked on the platform. Rewards distributed via the feeDistribution method are not locked by the smart contract.
## Lock-In:
There is a locking functionality whereby staked tokens will be locked for 30 days. Reward locks are tied into the same locking end date as the stake.
## Withdrawals:
There is a withdrawal functionality whereby on the withdrawal event, all unlocked tokens and any available rewards and accumulated Fee Distributions will be returned to the user's wallet in one transaction. There is also a “Claim” function, which will only withdraw tokens received via the feeDistribution method.
