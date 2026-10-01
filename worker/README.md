# Worker (`agentshield-demo`)

x402 HTTP 402 challenge endpoint. Deployed automatically on push to `main` via
`.github/workflows/deploy-worker.yml`.

- `src/index.js` — GET → 402 challenge; POST+X-PAYMENT → 501 until M1 verification
- `wrangler.jsonc` — bindings: KV (`agentshield`), Queue (`agentshield`), D1 (`agentshield-db`)
- Tests: `npm test` (node --test)

Live: https://agentshield-demo.j-mk644.workers.dev/
