// Base Sepolia USDC transfer verification (read-only RPC — no keys in worker)
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const DEFAULT_RPC = 'https://sepolia.base.org';

async function rpc(env, method, params) {
  const res = await fetch(env.RPC_URL || DEFAULT_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return { error: `rpc http ${res.status}` };
  const body = await res.json();
  if (body.error) return { error: body.error.message };
  return { result: body.result };
}

const topicToAddress = (topic) => `0x${topic.slice(-40).toLowerCase()}`;

/**
 * Verifies that txHash contains a successful USDC Transfer >= minAmount to payTo.
 * Returns { ok: true, from, amount } or { ok: false, reason }.
 */
export async function verifyUsdcTransfer(env, txHash, payTo, minAmount) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, reason: 'malformed tx hash' };
  }

  const r = await rpc(env, 'eth_getTransactionReceipt', [txHash]);
  if (r.error) return { ok: false, reason: `rpc error: ${r.error}` };
  const receipt = r.result;
  if (!receipt) return { ok: false, reason: 'tx not found on Base Sepolia' };
  if (receipt.status !== '0x1') return { ok: false, reason: 'tx reverted' };

  const target = payTo.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDC.toLowerCase()) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    if (log.topics.length < 3) continue;
    if (topicToAddress(log.topics[2]) !== target) continue;
    const value = BigInt(log.data);
    if (value < minAmount) continue;
    return { ok: true, from: topicToAddress(log.topics[1]), amount: value.toString() };
  }
  return { ok: false, reason: `no USDC transfer >= ${minAmount} to ${payTo} in tx` };
}
