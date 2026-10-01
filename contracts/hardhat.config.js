require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const pk = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

module.exports = {
  solidity: '0.8.24',
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      accounts: pk ? [pk] : [],
      chainId: 84532,
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: pk ? [pk] : [],
      chainId: 421614,
    },
    amoy: {
      url: process.env.AMOY_RPC_URL || process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology',
      accounts: pk ? [pk] : [],
      chainId: 80002,
    },
  },
};
