import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const PAY_TO = '0xCeb2c47f8B926806BbaDA35cF0d4C0014132e2BA';
const TX = `0x${'ab'.repeat(32)}`;

const env = (dbChanges = 1) => ({
  PAY_TO_ADDRESS: PAY_TO,
  DB: {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ success: true, meta: { changes: dbChanges } }),
      }),
    }),
  },
});

const USDC_RECEIPT = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    status: '0x1',
    logs: [
      {
        address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          `0x000000000000000000000000${'11'.repeat(20)}`,
          `0x000000000000000000000000${PAY_TO.slice(2).toLowerCase()}`,
        ],
        data: '0x0000000000000000000000000000000000000000000000000000000000002710',
      },
    ],
  },
};

const realFetch = globalThis.fetch;
const mockRpc = (body) => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
};
afterEach(() => {
  globalThis.fetch = realFetch;
});

const post = (txHash) =>
  new Request('https://demo.example/resource', {
    method: 'POST',
    ...(txHash ? { headers: { 'X-PAYMENT': txHash } } : {}),
  });

test('GET returns 402 with x402 challenge', async () => {
  const res = await worker.fetch(new Request('https://demo.example/resource'), env());
  assert.equal(res.status, 402);
  const body = await res.json();
  assert.equal(body.x402Version, 1);
  assert.equal(body.accepts[0].network, 'base-sepolia');
  assert.equal(body.accepts[0].payTo, PAY_TO);
  assert.equal(body.accepts[0].maxAmountRequired, '10000');
});

test('POST without X-PAYMENT returns 402', async () => {
  const res = await worker.fetch(post(null), env());
  assert.equal(res.status, 402);
});

test('POST with malformed tx hash returns 403', async () => {
  const res = await worker.fetch(post('not-a-tx'), env());
  assert.equal(res.status, 403);
  assert.match((await res.json()).error, /malformed/);
});

test('POST with valid USDC payment returns 200 resource', async () => {
  mockRpc(USDC_RECEIPT);
  const res = await worker.fetch(post(TX), env());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.tx, TX);
  assert.equal(body.amount, '10000');
});

test('POST replay of same tx returns 403 (D1 claims = 0)', async () => {
  mockRpc(USDC_RECEIPT);
  const res = await worker.fetch(post(TX), env(0));
  assert.equal(res.status, 403);
  assert.match((await res.json()).error, /already redeemed/);
});

test('POST with tx lacking matching transfer returns 403', async () => {
  mockRpc({ jsonrpc: '2.0', id: 1, result: { status: '0x1', logs: [] } });
  const res = await worker.fetch(post(TX), env());
  assert.equal(res.status, 403);
  assert.match((await res.json()).error, /no USDC transfer/);
});

test('POST with unknown tx returns 403', async () => {
  mockRpc({ jsonrpc: '2.0', id: 1, result: null });
  const res = await worker.fetch(post(TX), env());
  assert.equal(res.status, 403);
  assert.match((await res.json()).error, /not found/);
});

test('other methods return 405', async () => {
  const res = await worker.fetch(
    new Request('https://demo.example/', { method: 'DELETE' }),
    env()
  );
  assert.equal(res.status, 405);
});
