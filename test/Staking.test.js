
const {
    expect
} = require("chai");
const {
    deployments,
    network,
    ethers
} = require("hardhat");

describe("Staking contract: ", function() {
    let gatetoken;
    let staking;
    let compound;
    let accounts;

    beforeEach("Before Each: ", async function () {
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

    describe("Staking: ", async function () {
        it("Should revert on non approved stake", async function () {
            try {
                await staking.stake(BigInt(1000e18));
            }
            catch(error) {
                expect(error.message)
                .to.equal("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'")
            }
        })

        it("Should emit stake event with correct args", async function () {
            await gatetoken.approve(staking.address, BigInt(1000e18));

            expect(await staking.stake(BigInt(1000e18)))
            .to.emit(staking, "Staked")
            .withArgs(accounts[0].address, BigInt(1000e18));
        })     
//
        it("Should revert on too little stake", async function () {
            await gatetoken.approve(staking.address, 1);
            
            try{
                await staking.stake(1)
            }
            catch(error){
                expect(error.message)
                .to.equal("VM Exception while processing transaction: reverted with reason string 'Stake too small'")
            }
        })
//
        it("Should not revert on minimum stake", async function () {
            await gatetoken.approve(staking.address, BigInt(1000e18));
            
            try{
                await staking.stake(BigInt(1000e18));
            }
            catch(error){
                expect(error.message).to.equal("");
            }
        })
    })

    describe("Claim: ", async function () {
        it("Should claim all fees if only staker", async () => {
            console.log(await gatetoken.balanceOf(accounts[0].address))
            await gatetoken.approve(staking.address, BigInt(100000000000000e18));
            await staking.stake(BigInt(1000000e18));
            await staking.feeDistribution(BigInt(9e18));

            console.log(await gatetoken.balanceOf(accounts[0].address))

            await network.provider.send("evm_increaseTime", [3600])
            await network.provider.send("evm_mine", [])
            await staking.claim()
            console.log(await gatetoken.balanceOf(accounts[0].address))
        });
    })
});