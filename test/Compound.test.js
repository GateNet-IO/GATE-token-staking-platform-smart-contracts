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

        const Compound = await hre.ethers.getContractFactory("Compound");
        compound = await Compound.deploy(
            gatetoken.address,
            latestBlock.timestamp,
            latestBlock.timestamp + 24 * 60 * 60 * 30
        );

        await compound.deployed();
    });

    describe("deposit: ", async function () {
        it("Should successfully deposit", async function () {
            await gatetoken.approve(compound.address, BigInt(1000e18));
            await compound.deposit(BigInt(1000e18));
            expect(await compound.totalStaked()).to.equal(BigInt(1000e18));
            expect(await gatetoken.balanceOf(compound.address)).to.equal(
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
            expect(await compound.totalStaked()).to.equal(0);
            //expect(await gatetoken.balanceOf(compound.address)).to.equal(
            //    BigInt(0)
            //);
            //expect(await gatetoken.balanceOf(accounts[0].address)).to.equal(
            //    BigInt(await gatetoken.totalSupply())
            //);
        });

        it("Should successfully withdraw", async function () {
            await gatetoken.approve(compound.address, BigInt(3000e18));
            await compound.deposit(BigInt(1000e18));
            await compound.deposit(BigInt(2000e18));
            await network.provider.send("evm_increaseTime", [7048000]);
            await network.provider.send("evm_mine", []);
            await compound.withdraw(1);
            expect(await compound.totalStaked()).to.equal(BigInt(1000e18));
            //expect(await gatetoken.balanceOf(compound.address)).to.equal(
            //    BigInt(0)
            //);
            //expect(await gatetoken.balanceOf(accounts[0].address)).to.equal(
            //    BigInt(await gatetoken.totalSupply())
            //);
        });
    });

    describe("calculateFees: ", async function () {
        it("Should claim all fees if only staker", async function () {
            await gatetoken.approve(compound.address, BigInt(10000e18));
            await gatetoken.approve(compound.address, BigInt(10000e18));
            await compound.deposit(BigInt(1000e18));

            let balance = await gatetoken.balanceOf(accounts[0].address);

            await compound.feeDistribution(BigInt(9e18));
            await network.provider.send("evm_increaseTime", [3600]);
            await network.provider.send("evm_mine", []);
            await compound.claim();

            expect(balance).to.equal(
                await gatetoken.balanceOf(accounts[0].address)
            );
        });
    });

    describe("currentAmount: ", async function () {
        it("Should give current amount", async function () {
            await gatetoken.approve(compound.address, BigInt(10000e18));
            await gatetoken.approve(compound.address, BigInt(10000e18));
            await compound.deposit(BigInt(1000e18));

            expect(await compound.currentAmount(accounts[0].address)).to.equal(
                1000
            );
        });
    });

    describe("Started: ", async function () {
        beforeEach("Before Each: ", async function () {
            await network.provider.send("evm_increaseTime", [3600]);
            await network.provider.send("evm_mine", []);
        });

        describe("Unstaking: ", async function () {
            describe("Started: ", async function () {
                beforeEach("Before Each: ", async function () {
                    await network.provider.send("evm_increaseTime", [3600]);
                    await network.provider.send("evm_mine", []);
                });

                describe("Staking: ", async function () {
                    it("Should revert on non approved stake", async function () {
                        try {
                            await compound.deposit(BigInt(1000e18));
                        } catch (error) {
                            expect(error.message).to.equal(
                                "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'"
                            );
                        }
                    });

                    it("Should revert on too little stake", async function () {
                        await gatetoken.approve(compound.address, 1);

                        try {
                            await compound.deposit(1);
                        } catch (error) {
                            expect(error.message).to.equal(
                                "VM Exception while processing transaction: reverted with reason string 'Stake too small'"
                            );
                        }
                    });
                    //
                    it("Should not revert on minimum stake", async function () {
                        await gatetoken.approve(
                            compound.address,
                            BigInt(1000e18)
                        );

                        try {
                            await compound.deposit(BigInt(1000e18));
                        } catch (error) {
                            expect(error.message).to.equal("");
                        }
                    });
                });

                describe("Claim: ", async function () {
                    it("Shouldn't change anything if reward is 0", async () => {
                        await compound.claim();
                    });

                    it("Should claim all fees if only staker", async () => {
                        await gatetoken.approve(
                            compound.address,
                            BigInt(100000000000000e18)
                        );
                        await compound.deposit(BigInt(1000000e18));

                        let balance = await gatetoken.balanceOf(
                            accounts[0].address
                        );

                        await compound.feeDistribution(BigInt(9e18));
                        await network.provider.send("evm_increaseTime", [3600]);
                        await network.provider.send("evm_mine", []);
                        await compound.claim();

                        expect(balance).to.equal(
                            await gatetoken.balanceOf(accounts[0].address)
                        );
                    });

                    it("Should claim half the fees if 2 equal stakers", async () => {
                        await gatetoken.approve(
                            compound.address,
                            BigInt(100000000000000e18)
                        );
                        await compound.deposit(BigInt(1000000e18));

                        await gatetoken.transfer(
                            accounts[1].address,
                            BigInt(1000000e18)
                        );

                        await gatetoken
                            .connect(accounts[1])
                            .approve(
                                compound.address,
                                BigInt(100000000000000e18)
                            );
                        await compound
                            .connect(accounts[1])
                            .deposit(BigInt(1000000e18));
                        //
                        await compound.claim();

                        const tx1 = await compound.feeDistribution(
                            BigInt(9e18)
                        );
                        const rc1 = await tx1.wait();
                        const event1 = rc1.events.find(
                            (event) => event.event === "FeeDistributed"
                        );
                        const [block, amount1] = event1.args;

                        const tx2 = await compound.claim();
                        const rc2 = await tx2.wait();
                        const event2 = rc2.events.find(
                            (event) => event.event === "Claimed"
                        );
                        const [user, amount2] = event2.args;
                        //
                        expect(BigInt(amount1) / BigInt(2)).to.equal(
                            BigInt(amount2)
                        );
                    });
                });

                describe("feeDistribution: ", async function () {
                    it("Should revert on 0 fee", async () => {
                        try {
                            await compound.feeDistribution(BigInt(0));
                        } catch (error) {
                            expect(error.message).to.equal(
                                "VM Exception while processing transaction: reverted with reason string 'Cannot distribute 0 fee'"
                            );
                        }
                    });
                });

                describe("addReward: ", async function () {
                    it("Should add reward", async () => {
                        await gatetoken.approve(
                            compound.address,
                            BigInt(10000e18)
                        );

                        const tx = await compound.addReward(BigInt(10000e18));
                        const rc = await tx.wait();
                        const event = rc.events.find(
                            (event) => event.event === "RewardAdded"
                        );
                        const [amount] = event.args;

                        expect(
                            await gatetoken.balanceOf(compound.address)
                        ).to.equal(amount);
                    });
                });
            });

            describe("not started: ", async function () {
                it("Should not be able to stake", async () => {
                    try {
                        await gatetoken.approve(
                            compound.address,
                            BigInt(1000000e18)
                        );
                        await compound.deposit(BigInt(1000000e18));
                    } catch (error) {
                        expect(error.message).to.equal(
                            "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                        );
                    }
                });

                it("Should not be able to unstake", async () => {
                    try {
                        await compound.withdrawAll();
                    } catch (error) {
                        expect(error.message).to.equal(
                            "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                        );
                    }
                });

                it("Should not be able to claim", async () => {
                    try {
                        await compound.claim();
                    } catch (error) {
                        expect(error.message).to.equal(
                            "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                        );
                    }
                });
            });

            it("Should revert on minimum period not passed", async function () {
                await gatetoken.approve(compound.address, BigInt(1000e18));
                await compound.deposit(BigInt(1000e18));

                try {
                    await compound.withdrawAll();
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Minimum lock period hasn't passed'"
                    );
                }
            });
        });

        describe("Claim: ", async function () {
            it("Shouldn't change anything if reward is 0", async () => {
                await compound.claim();
            });

            it("Should claim all fees if only staker", async () => {
                await gatetoken.approve(
                    compound.address,
                    BigInt(100000000000000e18)
                );
                await compound.deposit(BigInt(1000000e18));

                let balance = await gatetoken.balanceOf(accounts[0].address);

                await compound.feeDistribution(BigInt(9e18));
                await network.provider.send("evm_increaseTime", [3600]);
                await network.provider.send("evm_mine", []);
                await compound.claim();

                expect(balance).to.equal(
                    await gatetoken.balanceOf(accounts[0].address)
                );
            });

            it("Should claim half the fees if 2 equal stakers", async () => {
                await gatetoken.approve(
                    compound.address,
                    BigInt(100000000000000e18)
                );
                await compound.deposit(BigInt(1000000e18));

                await gatetoken.transfer(
                    accounts[1].address,
                    BigInt(1000000e18)
                );

                await gatetoken
                    .connect(accounts[1])
                    .approve(compound.address, BigInt(100000000000000e18));
                await compound.connect(accounts[1]).deposit(BigInt(1000000e18));
                //
                await compound.claim();

                const tx1 = await compound.feeDistribution(BigInt(9e18));
                const rc1 = await tx1.wait();
                const event1 = rc1.events.find(
                    (event) => event.event === "FeeDistributed"
                );
                const [block, amount1] = event1.args;

                const tx2 = await compound.claim();
                const rc2 = await tx2.wait();
                const event2 = rc2.events.find(
                    (event) => event.event === "Claimed"
                );
                const [user, amount2] = event2.args;
                //
                expect(BigInt(amount1) / BigInt(2)).to.equal(BigInt(amount2));
            });
        });

        describe("feeDistribution: ", async function () {
            it("Should revert on 0 fee", async () => {
                try {
                    await compound.feeDistribution(BigInt(0));
                } catch (error) {
                    expect(error.message).to.equal(
                        "VM Exception while processing transaction: reverted with reason string 'Cannot distribute 0 fee'"
                    );
                }
            });
        });

        describe("addReward: ", async function () {
            it("Should add reward", async () => {
                await gatetoken.approve(compound.address, BigInt(10000e18));

                const tx = await compound.addReward(BigInt(10000e18));
                const rc = await tx.wait();
                const event = rc.events.find(
                    (event) => event.event === "RewardAdded"
                );
                const [amount] = event.args;

                expect(await gatetoken.balanceOf(compound.address)).to.equal(
                    amount
                );
            });
        });
    });

    describe("not started: ", async function () {
        it("Should not be able to stake", async () => {
            try {
                await gatetoken.approve(compound.address, BigInt(1000000e18));
                await compound.deposit(BigInt(1000000e18));
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });

        it("Should not be able to withdraw", async () => {
            try {
                await compound.withdrawAll();
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });

        it("Should not be able to claim", async () => {
            try {
                await compound.claim();
            } catch (error) {
                expect(error.message).to.equal(
                    "VM Exception while processing transaction: reverted with reason string 'Stake period hasn't started'"
                );
            }
        });
    });
});
