const { expect } = require("chai");
const { deployments, network, ethers } = require("hardhat");

describe("Compound contract: ", function () {
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

    describe("deposit & withdraw: ", async function () {
        it("successfully deposit", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));
            expect(await staking.totalStaked()).to.equal(BigInt(1000e18));
            expect(await gatetoken.balanceOf(staking.address)).to.equal(
                BigInt(1000e18)
            );
            expect(await gatetoken.balanceOf(accounts[0].address)).to.equal(
                BigInt(await gatetoken.totalSupply()) - BigInt(1000e18)
            );
        });
        it("successfully withdraw all", async function () {
            await network.provider.send("evm_increaseTime", [3000000]);
            await compound.withdrawAll();
            expect(await staking.totalStaked()).to.equal(0);
            expect(await gatetoken.balanceOf(staking.address)).to.equal(
                BigInt(0)
            );
            expect(await gatetoken.balanceOf(accounts[0].address)).to.equal(
                BigInt(await gatetoken.totalSupply())
            );
        });
        it("successfully withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));
            expect(await staking.totalStaked()).to.equal(BigInt(1000e18));
            await network.provider.send("evm_increaseTime", [3000000]);
            await compound.withdraw(1, 0);
        });
    });
});
