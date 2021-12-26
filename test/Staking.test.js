
const {
    expect
} = require("chai");
const {
    deployments,
    network,
    ethers
} = require("hardhat");

describe("Staking contract: ", () => {
    let gatetoken;
    let staking;
    let compound;
    let accounts;

    before("Before All: ", async () => {
        accounts = await ethers.getSigners();

        const GateToken = await hre.ethers.getContractFactory("GateToken");
        gatetoken = await GateToken.deploy();

        await gatetoken.deployed();

        const latestBlock = await hre.ethers.provider.getBlock("latest")

        const Staking = await hre.ethers.getContractFactory("Staking");
        staking = await Staking.deploy(gatetoken.address, latestBlock.timestamp, latestBlock.timestamp + (24 * 60 * 60 * 30));

        await staking.deployed();

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(gatetoken.address, staking.address);

        await compound.deployed();
        staking.setCompoundAddress(compound.address)
    })

    after("After All", async () => {

    })

    describe("Staking: ", async () => {
        it("Should revert on non approved stake", async () => {
            expect(staking.stake(BigInt(1000e18)))
            .to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        })

        it("Should emit stake event with correct args", async () => {
            await gatetoken.approve(staking.address, BigInt(1000e18));
        
            expect(staking.stake(BigInt(1000e18)))
            .to.emit(staking, "Staked")
            .withArgs(hre.ethers.getSigners()[0], BigInt(1000e18));
        })     
         
        it("Should revert on too little stake", async () => {
            gatetoken.approve(staking.address, 1);

            expect(staking.stake(1))
            .to.be.revertedWith("Stake too small");
        })

        it("Should not revert on minimum stake", async () => {
            gatetoken.approve(staking.address, BigInt(1000e18));

            expect(staking.stake(BigInt(1000e18)))
            .not.to.be.revertedWith("Stake too small");
        })
    })

    describe("Claim: ", async () => {
        //it("Should claim all fees if only staker", async () => {
        //    await gatetoken.approve(staking.address, BigInt(100000000000000e18));
        //    await staking.stake(BigInt(1000000e18));
        //    await staking.feeDistribution(BigInt(9e18));
        //    //await network.provider.send("evm_increaseTime", [3600])
        //    //await network.provider.send("evm_mine")
        //    //await staking.claim()
        //});
    })
});