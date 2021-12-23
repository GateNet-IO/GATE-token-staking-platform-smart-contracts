const networks = {
  1: "mainnet",
  4: "rinkeby",
  3: "rinkeby",
  42: "rinkeby",
  97: "rinkeby",
  31337: "hardhat",
};

const CONSTANTS = {
  mainnet: {
    staking: [
      6400, // blockPerDay
      1000000000000000000000, // minStakingAmount 1000 Gate
      192000, // lockPeriod 30 days
    ],
    compound: [
      10, // blockPerDay
      1000000000000000000000, // minStakingAmount 1000 Gate
      300, // lockPeriod 30 days (200 block in day)
      "0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c"
    ],
  },
  rinkeby: {
    staking: [
      5760, // blockPerDay
      1000000000000000000000, // minStakingAmount 1000 Gate
      5760, // lockPeriod 30 days
    ],
    compound: [
      5760, // blockPerDay
      1000000000000000000, // minStakingAmount 1000 Gate
      5760, // lockPeriod 30 days (200 block in day)
      "0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c"
    ],
  },
  hardhat: {
    staking: [
      10, // blockPerDay
      1000000000000000000, // minStakingAmount 1000 Gate
      300, // lockPeriod 30 days (200 block in day)
    ],
    compound: [
      10, // blockPerDay
      1000000000000000000, // minStakingAmount 1000 Gate
      300, // lockPeriod 30 days (200 block in day)
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ],
  },
};

async function getDeploymentArgs(chainId, contractName) {
  const blockNumber = await ethers.provider.getBlockNumber();
  let staking, rewardToken
  try {
    staking = (await ethers.getContract("Staking")).address;
    rewardToken = (await ethers.getContract("GateToken")).address;

} catch (e) {
    console.log(e);
}
  const { holder } = await getNamedAccounts();
  const deploymentArgs = {
    mainnet: {
      Staking: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        rewardPerBlock: "1000000000000000000",
        startBlock: blockNumber + 10,
        endBlock: blockNumber + 10000,
      },
      Compound: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        staking: staking,
      },
    },
    rinkeby: {
      Staking: {
        rewardToken: rewardToken,
        rewardPerBlock: "1000000000000000000",
        startBlock: blockNumber + 10,
        endBlock: blockNumber + 100000,
      },
      Compound: {
        rewardToken: rewardToken,
        staking: staking,
      },
    },
    localhost: {
      Staking: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        rewardPerBlock: "1000000000000000000",
        startBlock: blockNumber + 10,
        endBlock: blockNumber + 10000,
      },
      Compound: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        staking: staking,
      },
    },
    hardhat: {
      Staking: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        rewardPerBlock: "1000000000000000000",
        startBlock: blockNumber + 10,
        endBlock: blockNumber + 30000,
      },
      Compound: {
        rewardToken: "0x9d7630aDF7ab0b0CB00Af747Db76864df0EC82E4",
        staking: staking,
      },
    },
  };

  return deploymentArgs[networks[chainId]][contractName];
}
module.exports = {
  CONSTANTS,
  getDeploymentArgs,
};
