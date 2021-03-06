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

    // We get the contract to deploy
    const GateToken = await hre.ethers.getContractFactory("GateToken");
    const gatetoken = await GateToken.deploy();

    await gatetoken.deployTransaction.wait(5);
    console.log("token: " + gatetoken.address);

    const Compound = await hre.ethers.getContractFactory("Compound");
    const compound = await Compound.deploy(gatetoken.address, Start, End);

    await compound.deployTransaction.wait(5);
    console.log("compound: " + compound.address);

    await hre.run("verify:verify", {
        address: compound.address,
        constructorArguments: [gatetoken.address, Start, End],
        contract: "contracts/Compound.sol:Compound",
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
