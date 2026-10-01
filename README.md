# AgentShield Demo

The trust layer for agentic commerce — demo repository.

**What this proves (M0→M3):** a working x402 flow where an AI agent pays USDC on
testnet (Base Sepolia) and instantly receives a resource.

```bash
# M0/M1: the 402 challenge (reviewer script lands at M3)
curl -i https://agentshield-demo.j-mk644.workers.dev/
```

## Status

- [ ] M0 — 402 skeleton + Hardhat tests
- [ ] M1 — live Base Sepolia payment verification
- [ ] M2 — fulfillment + webhook + verified contract
- [ ] M3 — 90-second Loom + reviewer one-liner (demo gate)

## Structure

- `worker/` — Cloudflare Worker: x402 challenge + payment verification (Dev A)
- `contracts/` — Hardhat: verifier on Base Sepolia (Dev B)
- `client/` — agent script + Loom walkthrough (Dev C)

## Deploy

Push to `main` deploys the worker via GitHub Actions (`.github/workflows/deploy-worker.yml`).
Contract deploys are manual: Actions → *Deploy Contracts* → pick network.

## License

MIT
