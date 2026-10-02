#!/usr/bin/env node
// AgentShield demo client — the "AI agent" side of the x402 flow.
//
//   node agent.mjs challenge              GET the 402 payment challenge
//   node agent.mjs redeem --tx 0x<hash>   POST a tx hash, get the resource (no key needed)
//   node agent.mjs pay                    send 0.01 USDC to payTo (needs PAYER_PRIVATE_KEY)
//   node agent.mjs buy                    full loop: challenge -> pay -> redeem
//
// Env: AGENTSHIELD_URL (default live demo), PAYER_PRIVATE_KEY (testnet wallet
//      with Base Sepolia ETH for gas + USDC for the payment)

import { Contract, JsonRpcProvider, Wallet, formatUnits, parseUnits } from 'ethers';

const BASE = process.env.AGENTSHIELD_URL || 'https://agentshield-demo.j-mk644.workers.dev';
const USDC_ADDR = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
];

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
};

async function challenge() {
  const res = await fetch(BASE + '/');
  const body = await res.json();
  console.log(`GET ${BASE}/ -> ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
  return body;
}

async function redeem(txHash) {
  if (!txHash) throw new Error('missing --tx 0x<hash>');
  const res = await fetch(BASE + '/resource', {
    method: 'POST',
    headers: { 'X-PAYMENT': txHash },
  });
  const body = await res.json();
  console.log(`POST X-PAYMENT -> ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
  if (!res.ok) process.exitCode = 1;
  return body;
}

async function pay() {
  const pk = process.env.PAYER_PRIVATE_KEY;
  if (!pk) throw new Error('PAYER_PRIVATE_KEY not set (testnet wallet only)');
  const ch = await challenge();
  const accept = ch.accepts[0];
  const provider = new JsonRpcProvider('https://sepolia.base.org');
  const wallet = new Wallet(pk, provider);
  const usdc = new Contract(USDC_ADDR, USDC_ABI, wallet);

  const bal = await usdc.balanceOf(wallet.address);
  const need = BigInt(accept.maxAmountRequired);
  console.log(`payer ${wallet.address} balance ${formatUnits(bal, 6)} USDC, need ${formatUnits(need, 6)}`);
  if (bal < need) throw new Error('insufficient USDC — use the Base Sepolia faucet');

  const tx = await usdc.transfer(accept.payTo, need);
  console.log(`sent USDC tx: ${tx.hash}`);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error('USDC transfer reverted');
  console.log(`confirmed in block ${receipt.blockNumber}`);
  return tx.hash;
}

async function buy() {
  const txHash = await pay();
  await redeem(txHash);
}

const cmd = process.argv[2];
try {
  if (cmd === 'challenge') await challenge();
  else if (cmd === 'redeem') await redeem(arg('--tx'));
  else if (cmd === 'pay') await pay();
  else if (cmd === 'buy') await buy();
  else {
    console.log('usage: node agent.mjs <challenge|redeem --tx 0x..|pay|buy>');
    process.exit(2);
  }
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
