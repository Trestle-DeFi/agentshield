import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const env = { PAY_TO_ADDRESS: '0x1111111111111111111111111111111111111111' };

test('GET returns 402 with x402 challenge', async () => {
  const res = await worker.fetch(new Request('https://demo.example/resource'), env);
  assert.equal(res.status, 402);
  const body = await res.json();
  assert.equal(body.x402Version, 1);
  assert.equal(body.accepts[0].network, 'base-sepolia');
  assert.equal(body.accepts[0].payTo, env.PAY_TO_ADDRESS);
  assert.equal(body.accepts[0].asset, '0x036CbD53842c5426634e7929541eC2318f3dCF7e');
});

test('POST without X-PAYMENT returns 402', async () => {
  const res = await worker.fetch(
    new Request('https://demo.example/resource', { method: 'POST' }),
    env
  );
  assert.equal(res.status, 402);
});

test('POST with X-PAYMENT returns 501 until M1', async () => {
  const res = await worker.fetch(
    new Request('https://demo.example/resource', {
      method: 'POST',
      headers: { 'X-PAYMENT': 'dGVzdA==' },
    }),
    env
  );
  assert.equal(res.status, 501);
});

test('other methods return 405', async () => {
  const res = await worker.fetch(
    new Request('https://demo.example/', { method: 'DELETE' }),
    env
  );
  assert.equal(res.status, 405);
});
