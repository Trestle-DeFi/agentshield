// AgentShield demo worker — M1
// GET  -> 402 x402 payment challenge
// POST + X-PAYMENT: <txHash> -> verify USDC transfer on Base Sepolia,
//                          record in D1 (replay protection), return resource
// Note: X-PAYMENT currently carries a raw tx hash for demo simplicity;
//       M2 aligns the payload with the exact x402 spec format.
import { verifyUsdcTransfer } from './usdc.js';

const MIN_AMOUNT = 10000n; // 0.01 USDC (6 decimals) — keep in sync with GET challenge

const challenge = (resource, payTo) => ({
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base-sepolia',
      maxAmountRequired: MIN_AMOUNT.toString(),
      asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      payTo,
      resource,
      description: 'AgentShield demo: paid resource',
      maxTimeoutSeconds: 60,
    },
  ],
  error: null,
});

const denied = (reason) => Response.json({ error: reason }, { status: 403 });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const payTo = env.PAY_TO_ADDRESS;

    if (request.method === 'GET') {
      return Response.json(challenge(url.pathname, payTo), {
        status: 402,
        headers: { 'X-PAYMENT-REQUIRED': '1' },
      });
    }

    if (request.method === 'POST') {
      const txHash = request.headers.get('X-PAYMENT');
      if (!txHash) {
        return Response.json(challenge(url.pathname, payTo), { status: 402 });
      }

      const proof = await verifyUsdcTransfer(env, txHash, payTo, MIN_AMOUNT);
      if (!proof.ok) return denied(proof.reason);

      // Replay protection: one tx = one fulfillment. INSERT OR IGNORE wins the race.
      const claim = await env.DB.prepare(
        'INSERT OR IGNORE INTO payments (tx_hash, payer, amount) VALUES (?1, ?2, ?3)'
      )
        .bind(txHash.toLowerCase(), proof.from, proof.amount)
        .run();

      if (!claim.meta.changes) {
        return denied('payment already redeemed');
      }

      return Response.json({
        ok: true,
        resource: url.pathname,
        tx: txHash.toLowerCase(),
        payer: proof.from,
        amount: proof.amount,
        content: 'Paid content delivered. AgentShield demo M1 complete.',
      });
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
