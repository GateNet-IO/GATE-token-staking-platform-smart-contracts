const { expect } = require("chai");
const { deployments, network, ethers } = require("hardhat");

describe("Workflow tests: ", function () {
    let gatetoken;
    let staking;
    let compound;
    let accounts;

    beforeEach("Before Each: ", async function () {
        accounts = await ethers.getSigners();

        const GateToken = await hre.ethers.getContractFactory("GateToken");
        gatetoken = await GateToken.deploy();

        await gatetoken.deployed();

        const latestBlock = await hre.ethers.provider.getBlock("latest");

        const Staking = await hre.ethers.getContractFactory("Staking");
        staking = await Staking.deploy(
            gatetoken.address,
            latestBlock.timestamp,
            latestBlock.timestamp + 24 * 60 * 60 * 30
        );

        await staking.deployed();

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(gatetoken.address, staking.address);

        await compound.deployed();
        staking.setCompoundAddress(compound.address);
    });

    describe("Test: ", async function () {
        it("Daryl McFarlane txns", async function () {
            await gatetoken.approve(staking.address, BigInt(1000000e18));
            await gatetoken.transfer(accounts[1].address, BigInt(20000e18));
            console.log(await gatetoken.balanceOf(accounts[0].address));
            await staking.addReward(BigInt(1000000e18));

            await gatetoken
                .connect(accounts[1])
                .approve(staking.address, BigInt(1000000e18));
            await gatetoken
                .connect(accounts[1])
                .approve(compound.address, BigInt(1000000e18));

            console.log(await gatetoken.balanceOf(accounts[1].address));
            await compound.connect(accounts[1]).deposit(BigInt(9999e18));
            await network.provider.send("evm_increaseTime", [704800]);
            await network.provider.send("evm_mine", []);
            await compound.connect(accounts[1]).deposit(BigInt(9999e18));
            await network.provider.send("evm_increaseTime", [7048000]);
            await network.provider.send("evm_mine", []);
            await compound.connect(accounts[1]).withdrawAll();
            console.log(await gatetoken.balanceOf(accounts[1].address));
        });
    });
});
