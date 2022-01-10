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

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(
            gatetoken.address,
            latestBlock.timestamp,
            latestBlock.timestamp + 24 * 60 * 60 * 30
        );

        await compound.deployed();
    });

    describe("Test: ", async function () {
        it("Daz txns", async function () {
            await gatetoken.approve(compound.address, BigInt(4000000e18));
            await gatetoken.transfer(accounts[1].address, BigInt(200000e18));
            await gatetoken.transfer(accounts[2].address, BigInt(200000e18));
            await compound.addReward(BigInt(1000000e18));

            await network.provider.send("evm_increaseTime", [60]);
            await network.provider.send("evm_mine", []);

            await gatetoken
                .connect(accounts[1])
                .approve(compound.address, BigInt(20000000e18));
            await gatetoken
                .connect(accounts[2])
                .approve(compound.address, BigInt(20000000e18));

            await compound.connect(accounts[1]).deposit(BigInt(9999e18));
            await network.provider.send("evm_increaseTime", [704800]);
            await network.provider.send("evm_mine", []);
            await compound.connect(accounts[1]).deposit(BigInt(9999e18));
            await compound.connect(accounts[1]).deposit(BigInt(9999e18));
            await network.provider.send("evm_increaseTime", [1000]);
            await network.provider.send("evm_mine", []);
            await compound.connect(accounts[2]).deposit(BigInt(9999e18));
            await compound.connect(accounts[0]).deposit(BigInt(9999e18));
            await network.provider.send("evm_increaseTime", [70480000000]);
            await network.provider.send("evm_mine", []);
            await compound.connect(accounts[1]).withdrawAll();
            await compound.connect(accounts[2]).withdrawAll();
            await compound.withdrawAll();
            //console.log(await gatetoken.balanceOf(compound.address));
            //await gatetoken.approve(compound.address, BigInt(10000000000e18));
            //await gatetoken.approve(compound.address, BigInt(10000000000e18));
            //
            //await gatetoken
            //    .connect(accounts[1])
            //    .approve(compound.address, BigInt(10000000000e18));
            //await gatetoken
            //    .connect(accounts[1])
            //    .approve(compound.address, BigInt(10000000000e18));
            //
            //await gatetoken.transfer(accounts[1].address, BigInt(1000e18));
            //
            //await compound.addReward(BigInt(1000000e18));
            //
            //await network.provider.send("evm_increaseTime", [60]);
            //await network.provider.send("evm_mine", []);
            //
            //await compound.deposit(BigInt(1000e18));
            //
            //await network.provider.send("evm_increaseTime", [60]);
            //await network.provider.send("evm_mine", []);
            //
            //await compound.connect(accounts[1]).deposit(BigInt(1000e18));
            //
            //await network.provider.send("evm_increaseTime", [3000000]);
            //await network.provider.send("evm_mine", []);
            //
            //await compound.withdrawAll();
            //await compound.connect(accounts[1]).withdrawAll();
            //
            //console.log(await gatetoken.balanceOf(compound.address));
        });
    });
});
