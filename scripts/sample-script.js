// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const GateToken = await hre.ethers.getContractFactory("GateToken");
  const gatetoken = await GateToken.deploy();

  await gatetoken.deployed();
  console.log(gatetoken.address);

  let end = new Date();
  end.setDate(end.getDate() + 31); 
  const End = Math.floor(end.getTime() / 1000);
  let start = new Date();
  start.setDate(start.getDate());
  const Start = Math.floor(start.getTime() / 1000);

  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(gatetoken.address, Start, End);

  await staking.deployed();
  console.log(staking.address);

  const Compound = await hre.ethers.getContractFactory("Compound");
  const compound = await Compound.deploy(gatetoken.address, staking.address);

  await compound.deployed();
  console.log(compound.address);

  await hre.run("verify:verify", {
    address: gatetoken.address,
    constructorArguments: [
    ],
    contract: "contracts/GateToken.sol:GateToken"
  });

  await hre.run("verify:verify", {
    address: compound.address,
    constructorArguments: [
      gatetoken.address, 
      staking.address
    ],
    contract: "contracts/Compound.sol:Compound"
  });

  await hre.run("verify:verify", {
    address: staking.address,
    constructorArguments: [
      gatetoken.address, 
      Start, 
      End
    ],
    contract: "contracts/Staking.sol:Staking"
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
