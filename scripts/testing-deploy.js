// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    let end = new Date();
    end.setDate(end.getDate() + 31);
    const End = Math.floor(end.getTime() / 1000);
    let start = new Date();
    start.setDate(start.getDate());
    const Start = Math.floor(start.getTime() / 1000);

    const Staking = await hre.ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
        "0x0acde866f8b214f30cffe1381a150e4246ba1398",
        Start,
        End
    );

    await staking.deployTransaction.wait(5);
    console.log("staking: " + staking.address);

    const Compound = await hre.ethers.getContractFactory("Compound");
    const compound = await Compound.deploy(
        "0x0acde866f8b214f30cffe1381a150e4246ba1398",
        staking.address
    );

    await compound.deployTransaction.wait(5);
    console.log("compound: " + compound.address);

    await hre.run("verify:verify", {
        address: compound.address,
        constructorArguments: [
            "0x0acde866f8b214f30cffe1381a150e4246ba1398",
            staking.address,
        ],
        contract: "contracts/Compound.sol:Compound",
    });

    await hre.run("verify:verify", {
        address: staking.address,
        constructorArguments: [
            "0x0acde866f8b214f30cffe1381a150e4246ba1398",
            Start,
            End,
        ],
        contract: "contracts/Staking.sol:Staking",
    });

    await staking.setCompoundAddress(compound.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
