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
            latestBlock.timestamp + 60,
            latestBlock.timestamp + 24 * 60 * 60 * 30
        );

        await staking.deployed();

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(gatetoken.address, staking.address);

        await compound.deployed();
        staking.setCompoundAddress(compound.address);
    });

    describe("Big tests: ", async function () {
        it("1", async function () {
            await gatetoken.approve(staking.address, BigInt(1000000e18));
            await gatetoken.transfer(accounts[1].address, BigInt(1000000e18));
            await gatetoken.transfer(accounts[2].address, BigInt(1000000e18));

            const tx = await staking.addReward(BigInt(10000e18));
            const rc = await tx.wait();
            const event = rc.events.find(
                (event) => event.event === "RewardAdded"
            );
            const [amount] = event.args;

            expect(await gatetoken.balanceOf(staking.address)).to.equal(amount);
        });
    });
});
