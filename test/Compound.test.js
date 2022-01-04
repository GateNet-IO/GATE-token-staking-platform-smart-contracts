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

    describe("deposit: ", async function () {
        it("Should successfully deposit", async function () {
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

        it("Should revert on too small stake", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));

            try {
                await compound.deposit(BigInt(1e18));
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake too small'"
                );
            }
        });
    });

    describe("withdraw: ", async function () {
        it("Should change nothing if nothing deposited", async function () {
            await compound.withdrawAll();
        });

        it("Should successfully withdraw all", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));
            await network.provider.send("evm_increaseTime", [7048000]);
            await network.provider.send("evm_mine", []);
            await compound.withdrawAll();
            expect(await staking.totalStaked()).to.equal(0);
            expect(await gatetoken.balanceOf(staking.address)).to.equal(
                BigInt(0)
            );
            expect(await gatetoken.balanceOf(accounts[0].address)).to.equal(
                BigInt(await gatetoken.totalSupply())
            );
        });

        it("Should successfully withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));
            expect(await staking.totalStaked()).to.equal(BigInt(1000e18));
            await network.provider.send("evm_increaseTime", [3000000]);
            await compound.withdraw(1, 0);
            expect(await staking.totalStaked()).to.equal(
                BigInt(1000e18) - BigInt(await compound.shareWorth())
            );
        });

        it("Should revert on zero withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));

            try {
                await compound.withdraw(0, 0);
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Cannot unstake 0'"
                );
            }
        });

        it("Should revert on too big withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));

            try {
                await compound.withdraw(BigInt(10000), 0);
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake too big'"
                );
            }
        });

        it("Should revert on too fast withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));

            try {
                await compound.withdraw(BigInt(1000), 0);
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Minimum lock period hasn't passed'"
                );
            }
        });
    });

    describe("calculateFees: ", async function () {
        it("Should claim all fees if only staker", async function () {
            await gatetoken.approve(compound.address, BigInt(10000e18));
            await gatetoken.approve(staking.address, BigInt(10000e18));
            await compound.deposit(BigInt(1000e18));

            let balance = await gatetoken.balanceOf(accounts[0].address);

            await staking.feeDistribution(BigInt(9e18));
            await network.provider.send("evm_increaseTime", [3600]);
            await network.provider.send("evm_mine", []);
            await staking.claim();

            expect(balance).to.equal(
                await gatetoken.balanceOf(accounts[0].address)
            );
        });
    });
});
