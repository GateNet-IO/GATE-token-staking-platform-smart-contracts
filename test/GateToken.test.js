const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GateToken contract: ", function () {
    let accounts;

    before("Before All: ", async () => {
        accounts = await ethers.getSigners();
        let SimpleToken = await hre.ethers.getContractFactory("GateToken");
        let simpletoken = await SimpleToken.deploy();
        this.token = await ethers.getContractAt("IGateToken", simpletoken.address, accounts.caller);
    })
    
    it("Should connect to preDeployed GateToken contract: ", async () => {
        expect(await this.token.totalSupply()).to.not.equal(0)
    })
})