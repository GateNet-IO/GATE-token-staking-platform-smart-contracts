const {
    getEOAAccountsPrivateKeys
} = require("./accounts")

eoaAccountsPrivateKeys = getEOAAccountsPrivateKeys()

const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
const MNEMONIC = process.env.MNEMONIC || 'test test test test test test test test test test test junk';
const DEPLOYMENT_ACCOUNT_KEY = process.env.DEPLOYMENT_ACCOUNT_KEY || eoaAccountsPrivateKeys[0];
const FORKING_BLOCK = Number(process.env.FORKING_BLOCK);
const IS_FORKING = process.env.IS_FORKING === "true";

const networks = {
    mainnet: {
        url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        gasPrice: 120 * 1000000000,
        chainId: 1,
    },
    localhost: {
        live: false,
        saveDeployments: true,
        tags: ["local"],
    },
    hardhat: {
        forking: {
            enabled: IS_FORKING,
            url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
            blockNumber: FORKING_BLOCK
        },
        accounts: {
            mnemonic: MNEMONIC,
        },
        live: false,
        saveDeployments: true,
        tags: ["test", "local"],
    },
    etherlite: {
        url: "https://rpc.etherlite.org/",
        accounts: eoaAccountsPrivateKeys,
        chainId: 111,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gas: 5198000,
        gasMultiplier: 2,
    },
    ropsten: {
        url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
        accounts: eoaAccountsPrivateKeys,
        chainId: 3,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasPrice: 5000000000,
        gasMultiplier: 2,
    },
    rinkeby: {
        url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
        accounts: eoaAccountsPrivateKeys,
        chainId: 4,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasPrice: 5000000000,
        gasMultiplier: 2,
    },
    goerli: {
        url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
        accounts: eoaAccountsPrivateKeys,
        chainId: 5,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasPrice: 5000000000,
        gasMultiplier: 2,
    },
    kovan: {
        url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
        accounts: eoaAccountsPrivateKeys,
        chainId: 42,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasPrice: 20000000000,
        gasMultiplier: 2,
    },
    moonbase: {
        url: "https://rpc.testnet.moonbeam.network",
        accounts: eoaAccountsPrivateKeys,
        chainId: 1287,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gas: 5198000,
        gasMultiplier: 2,
    },
    arbitrum: {
        url: "https://kovan3.arbitrum.io/rpc",
        accounts: eoaAccountsPrivateKeys,
        chainId: 79377087078960,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    fantom: {
        url: "https://rpcapi.fantom.network",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 250,
        live: true,
        saveDeployments: true,
        gasPrice: 22000000000,
    },
    "fantom-testnet": {
        url: "https://rpc.testnet.fantom.network",
        accounts: eoaAccountsPrivateKeys,
        chainId: 4002,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    matic: {
        url: "https://rpc-mainnet.maticvigil.com",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 137,
        live: true,
        saveDeployments: true,
    },
    mumbai: {
        url: "https://rpc-mumbai.maticvigil.com/",
        accounts: eoaAccountsPrivateKeys,
        chainId: 80001,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    xdai: {
        url: "https://rpc.xdaichain.com",
        accounts: eoaAccountsPrivateKeys,
        chainId: 100,
        live: true,
        saveDeployments: true,
    },
    bsc: {
        url: "https://bsc-dataseed.binance.org",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 56,
        live: true,
        saveDeployments: true,
    },
    "bsc-testnet": {
        url: "https://data-seed-prebsc-2-s3.binance.org:8545",
        accounts: eoaAccountsPrivateKeys,
        chainId: 97,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    heco: {
        url: "https://http-mainnet.hecochain.com",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 128,
        live: true,
        saveDeployments: true,
    },
    "heco-testnet": {
        url: "https://http-testnet.hecochain.com",
        accounts: eoaAccountsPrivateKeys,
        chainId: 256,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    avalanche: {
        url: "https://api.avax.network/ext/bc/C/rpc",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 43114,
        live: true,
        saveDeployments: true,
        gasPrice: 470000000000,
    },
    fuji: {
        url: "https://api.avax-test.network/ext/bc/C/rpc",
        accounts: eoaAccountsPrivateKeys,
        chainId: 43113,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
    harmony: {
        url: "https://api.s0.t.hmny.io",
        accounts: [DEPLOYMENT_ACCOUNT_KEY],
        chainId: 1666600000,
        live: true,
        saveDeployments: true,
    },
    "harmony-testnet": {
        url: "https://api.s0.b.hmny.io",
        accounts: eoaAccountsPrivateKeys,
        chainId: 1666700000,
        live: true,
        saveDeployments: true,
        tags: ["staging"],
        gasMultiplier: 2,
    },
}

const networksProxyData = {
    "1": "mainnet.json",
    "3": "ropsten.json",
    "4": "rinkeby.json",
    "5": "goerli.json",
    "42": "kovan.json",
    "56": "unknown-56.json", // bsc
    "97": "unknown-97.json", // bsc-testnet
    "100": "unknown-100.json", // xdai
    "128": "unknown-128.json", // heco
    "256": "unknown-256.json", // heco-testnet
    "1287": "unknown-1287.json", // moonbase
    "250": "unknown-250.json", // fantom
    "4002": "unknown-4002.json", // fantom-testnet
    "137": "unknown-137.json", // matic
    "80001": "unknown-80001.json", // mumbai
    "43113": "unknown-43113.json", // fuji
    "43114": "unknown-43114.json", // avalanche
    "1666600000": "unknown-1666600000.json", // harmony
    "1666700000": "unknown-1666700000.json", // harmony-testnet
    "79377087078960": "unknown-79377087078960.json", // arbitrum
    "31337": "unknown-31337.json", // hardhat
}

const eConfig = async () => {
    let preDeployedProxyJSON
    const chainId = await getChainId();
    try {
        preDeployedProxyJSON = require("../../.openzeppelin/" + networksProxyData[chainId])
    } catch (error) {
        preDeployedProxyJSON = "undefined"
    }

    if (preDeployedProxyJSON == "undefined") {
        if (process.env.UPGRADEABLE_PROXY_ADDRESS === '') {
            return {
                IS_UPGRADE: false,
                IS_PROXY: process.env.IS_PROXY === "true",
            }
        }

        return {
            IS_UPGRADE: process.env.IS_UPGRADE === "true",
            IS_PROXY: process.env.IS_PROXY === "true",
            UPGRADEABLE_PROXY_ADDRESS: process.env.UPGRADEABLE_PROXY_ADDRESS
        }
    }

    const lastDeployedAddress = preDeployedProxyJSON.proxies[preDeployedProxyJSON.proxies.length - 1].address;
    return {
        IS_UPGRADE: process.env.IS_UPGRADE === "true",
        IS_PROXY: process.env.IS_PROXY === "true",
        UPGRADEABLE_PROXY_ADDRESS: process.env.UPGRADEABLE_PROXY_ADDRESS || lastDeployedAddress
    }
}

module.exports = {
    eConfig,
    networksProxyData,
    networks
}