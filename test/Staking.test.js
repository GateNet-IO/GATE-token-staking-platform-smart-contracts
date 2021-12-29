const { expect } = require("chai");
const { deployments, network, ethers } = require("hardhat");

describe("Staking contract: ", function () {
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
            latestBlock.timestamp + 1814460
        );

        await staking.deployed();

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(gatetoken.address, staking.address);

        await compound.deployed();
        staking.setCompoundAddress(compound.address);
    });
    describe("Started: ", async function () {
        beforeEach("Before Each: ", async function () {
            await network.provider.send("evm_increaseTime", [3600]);
            await network.provider.send("evm_mine", []);
        });

        describe("Unstaking: ", async function () {
            it("Should revert on 0 unstake", async function () {
                await gatetoken.approve(staking.address, BigInt(1000e18));
                await staking.stake(BigInt(1000e18));

                try {
                    await staking.unstake(0, 0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Cannot unstake 0'"
                    );
                }
            });

            it("Should revert on stake too big", async function () {
                await gatetoken.approve(staking.address, BigInt(1000e18));
                await staking.stake(BigInt(1000e18));

                try {
                    await staking.unstake(BigInt(2000e18), 0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Stake too big'"
                    );
                }
            });

            it("Should revert on minimum period not passed", async function () {
                await gatetoken.approve(staking.address, BigInt(1000e18));
                await staking.stake(BigInt(1000e18));

                try {
                    await staking.unstake(BigInt(1000e18), 0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Minimum lock period hasn't passed'"
                    );
                }
            });
        });

        describe("Staking: ", async function () {
            it("Should revert on non approved stake", async function () {
                try {
                    await staking.stake(BigInt(1000e18));
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'"
                    );
                }
            });

            it("Should emit stake event with correct args", async function () {
                await gatetoken.approve(staking.address, BigInt(1000e18));

                expect(await staking.stake(BigInt(1000e18)))
                    .to.emit(staking, "Staked")
                    .withArgs(accounts[0].address, BigInt(1000e18));
            });
            //
            it("Should revert on too little stake", async function () {
                await gatetoken.approve(staking.address, 1);

                try {
                    await staking.stake(1);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Stake too small'"
                    );
                }
            });
            //
            it("Should not revert on minimum stake", async function () {
                await gatetoken.approve(staking.address, BigInt(1000e18));

                try {
                    await staking.stake(BigInt(1000e18));
                } catch (error) {
                    expect(error.message).to.equal("");
                }
            });
        });

        describe("Claim: ", async function () {
            it("Shouldn't change anything if reward is 0", async () => {
                await staking.claim();
            });

            it("Should claim all fees if only staker", async () => {
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );
                await staking.stake(BigInt(1000000e18));

                let balance = await gatetoken.balanceOf(accounts[0].address);

                await staking.feeDistribution(BigInt(9e18));
                await network.provider.send("evm_increaseTime", [3600]);
                await network.provider.send("evm_mine", []);
                await staking.claim();

                expect(balance).to.equal(
                    await gatetoken.balanceOf(accounts[0].address)
                );
            });

            it("Should claim half the fees if 2 equal stakers", async () => {
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );
                await staking.stake(BigInt(1000000e18));

                await gatetoken.transfer(
                    accounts[1].address,
                    BigInt(1000000e18)
                );

                await gatetoken
                    .connect(accounts[1])
                    .approve(staking.address, BigInt(100000000000000e18));
                await staking.connect(accounts[1]).stake(BigInt(1000000e18));
                //
                await staking.claim();

                const tx1 = await staking.feeDistribution(BigInt(9e18));
                const rc1 = await tx1.wait();
                const event1 = rc1.events.find(
                    (event) => event.event === "FeeDistributed"
                );
                const [block, amount1] = event1.args;

                const tx2 = await staking.claim();
                const rc2 = await tx2.wait();
                const event2 = rc2.events.find(
                    (event) => event.event === "Claimed"
                );
                const [user, amount2] = event2.args;
                //
                expect(BigInt(amount1) / BigInt(2)).to.equal(BigInt(amount2));
            });
        });

        describe("PendingFee: ", async function () {
            it("Should show correct fee", async () => {
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );
                await staking.stake(BigInt(1000000e18));

                const tx = await staking.feeDistribution(BigInt(9e18));
                const rc = await tx.wait();
                const event = rc.events.find(
                    (event) => event.event === "FeeDistributed"
                );
                const [block, amount] = event.args;

                expect(await staking.pendingFee(accounts[0].address)).to.equal(
                    amount
                );
            });
        });

        describe("feeDistribution: ", async function () {
            it("Should revert on 0 fee", async () => {
                try {
                    await staking.feeDistribution(BigInt(0));
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Cannot distribute 0 fee'"
                    );
                }
            });
        });

        describe("addReward: ", async function () {
            it("Should add reward", async () => {
                await gatetoken.approve(staking.address, BigInt(10000e18));

                const tx = await staking.addReward(BigInt(10000e18));
                const rc = await tx.wait();
                const event = rc.events.find(
                    (event) => event.event === "RewardAdded"
                );
                const [amount] = event.args;

                expect(amount).to.equal(
                    BigInt(await staking.rewardRate()) *
                        (BigInt(await staking.endDate()) -
                            BigInt(await staking.firstTimeRewardApplicable()))
                );
                expect(await gatetoken.balanceOf(staking.address)).to.equal(
                    amount
                );
            });
        });

        describe("setOnlyCompoundStaking: ", async function () {
            it("Should prevent non compound staking", async () => {
                staking.setOnlyCompoundStaking(true);
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );

                try {
                    await staking.stake(BigInt(1000000e18));
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Only auto-compound staking allowed'"
                    );
                }
            });

            it("Should allow non compound staking", async () => {
                staking.setOnlyCompoundStaking(false);
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );

                try {
                    await staking.stake(BigInt(1000000e18));
                } catch (error) {
                    expect(error.message).to.equal("");
                }
            });
        });

        describe("unstakeAll: ", async function () {
            it("Should unstakeAll", async () => {
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );
                await staking.stake(BigInt(1000000e18));
                await staking.stake(BigInt(1000000e18));
                await staking.stake(BigInt(1000000e18));
                expect(
                    await staking.totalUserStakes(accounts[0].address)
                ).to.equal(3);

                await network.provider.send("evm_increaseTime", [200000000]);
                await network.provider.send("evm_mine", []);

                let stakes = await staking.getUserStakes(accounts[0].address);
                await staking.unstakeAll();
                let newStakes = await staking.getUserStakes(
                    accounts[0].address
                );
                expect(newStakes).not.to.equal(stakes);

                for (let i = 0; i < 3; i++) {
                    expect(newStakes[i].amount).to.equal(0);
                }
            });

            it("Should skip recent stakes", async () => {
                await gatetoken.approve(
                    staking.address,
                    BigInt(100000000000000e18)
                );
                await staking.stake(BigInt(1000000e18));

                await network.provider.send("evm_increaseTime", [350000]);
                await network.provider.send("evm_mine", []);

                await staking.stake(BigInt(1000000e18));

                await network.provider.send("evm_increaseTime", [350000]);
                await network.provider.send("evm_mine", []);

                expect(
                    await staking.totalUserStakes(accounts[0].address)
                ).to.equal(2);

                let stakes = await staking.getUserStakes(accounts[0].address);
                await staking.unstakeAll();
                let newStakes = await staking.getUserStakes(
                    accounts[0].address
                );
                expect(newStakes).not.to.equal(stakes);

                for (let i = 0; i < 2; i++) {
                    expect(newStakes[i].amount).to.equal(BigInt(1000000e18));
                }
            });
        });
    });

    describe("not started: ", async function () {
        it("Should not be able to stake", async () => {
            try {
                await staking.stake(100000);
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });

        it("Should not be able to unstake", async () => {
            try {
                await staking.unstake(100000, 0);
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });

        it("Should not be able to claim", async () => {
            try {
                await staking.claim();
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });
    });

    describe("not compound: ", async function () {
        describe("addFee: ", async function () {
            it("Should revert", async () => {
                try {
                    await staking.addFee(accounts[0].address, 0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Only compound'"
                    );
                }
            });
        });
        describe("autoCompStake: ", async function () {
            it("Should revert", async () => {
                try {
                    await staking.autoCompStake(0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Only compound'"
                    );
                }
            });
        });
        describe("autoCompUnstake: ", async function () {
            it("Should revert", async () => {
                try {
                    await staking.autoCompUnstake(0, 0);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Only compound'"
                    );
                }
            });
        });
        describe("transferReward: ", async function () {
            it("Should revert", async () => {
                try {
                    await staking.transferReward(0, accounts[0].address);
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Only compound'"
                    );
                }
            });
        });
    });
});
