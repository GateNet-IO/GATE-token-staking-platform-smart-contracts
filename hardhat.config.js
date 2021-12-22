require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/IhrfKgLqAqhO8frEPp_v4bcpfC2bbEWC", //Infura url with projectId
      accounts: ["498c6973c5652ed3b50df640b0a1fa7d072ef73b9ca2e39135fec27e8b8becac"] // add the account that will deploy the contract (private key)

    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "NT4DZBRYD79C7HV84Z916JKDEPPB22YTJH"
  }
};