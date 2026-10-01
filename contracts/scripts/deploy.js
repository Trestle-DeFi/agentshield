const { ethers, network } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Canonical USDC per network
const USDC = {
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  arbitrumSepolia: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  amoy: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
};

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY not set (testnet-only deployer required)');
  }
  const usdc = USDC[network.name];
  if (!usdc) throw new Error(`no USDC address configured for network ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`network=${network.name} deployer=${deployer.address}`);

  const Escrow = await ethers.getContractFactory('AgentShieldDemoEscrow');
  const escrow = await Escrow.deploy(usdc);
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  console.log(`AgentShieldDemoEscrow: ${address}`);

  const out = {
    network: network.name,
    contract: 'AgentShieldDemoEscrow',
    address,
    usdc,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`saved ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
