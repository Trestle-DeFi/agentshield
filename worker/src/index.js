// AgentShield demo worker — M0 skeleton
// GET  -> 402 x402 payment challenge
// POST + X-PAYMENT header -> verification not implemented yet (M1)
// Replaces the default Hello World on agentshield-demo.j-mk644.workers.dev

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const challenge = (resource, payTo) => ({
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base-sepolia',
      maxAmountRequired: '10000', // 0.01 USDC (6 decimals)
      asset: USDC_BASE_SEPOLIA,
      payTo,
      resource,
      description: 'AgentShield demo: paid resource',
      maxTimeoutSeconds: 60,
    },
  ],
  error: null,
});

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
      const payment = request.headers.get('X-PAYMENT');
      if (!payment) {
        return Response.json(challenge(url.pathname, payTo), { status: 402 });
      }
      // M1: verify Base Sepolia USDC payment proof, record in DB (D1), then fulfill
      return Response.json(
        { error: 'payment verification not implemented (M1)' },
        { status: 501 }
      );
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
