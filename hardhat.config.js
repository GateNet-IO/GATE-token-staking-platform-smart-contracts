require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");
require("hardhat-gas-reporter");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
    solidity: "0.8.9",
    networks: {
        rinkeby: {
            url: process.env.RINKEBY_URL, //Infura url with projectId
            accounts: [process.env.PRIVATE_KEY], // add the account that will deploy the contract (private key)
        },
        goerli: {
            url: process.env.GOERLI_URL, //Infura url with projectId
            accounts: [process.env.PRIVATE_KEY], // add the account that will deploy the contract (private key)
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_API,
    },
    mocha: {
        timeout: 1000000000000000,
    },
};
