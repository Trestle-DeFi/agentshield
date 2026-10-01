require('@nomicfoundation/hardhat-toolbox');

const pk = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = {
  solidity: '0.8.24',
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: pk ? [pk] : [],
      chainId: 84532,
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: pk ? [pk] : [],
      chainId: 421614,
    },
    amoy: {
      url: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: pk ? [pk] : [],
      chainId: 80002,
    },
  },
};
