# AgentShield Demo

The trust layer for agentic commerce — demo repository.

**What this proves (M0→M3):** a working x402 flow where an AI agent pays USDC on
testnet (Base Sepolia) and instantly receives a resource.

## Try it (5-minute reviewer run)

```bash
# 1. See the 402 payment challenge
curl -i https://agentshield-demo.j-mk644.workers.dev/

# 2. See replay protection (this tx was already redeemed -> 403)
node client/agent.mjs redeem --tx 0xdd3c2058c0a1661574997f5a9f70b76ef21f3c33008f1e8a5fa30a890aef93e5

# Or run the full agent loop yourself (testnet only, returns 200 on first use):
cd client && npm install
export PAYER_PRIVATE_KEY=0x...   # testnet wallet: needs Base Sepolia ETH + USDC
node agent.mjs buy               # challenge -> pay 0.01 USDC -> get resource
```

Faucets: [Base Sepolia ETH](https://docs.alchemy.com/docs/fund-your-testnet-account-on-base-sepolia) · [USDC (Circle)](https://faucet.circle.com) — never use real funds.

Expected results:
- `GET /` → **402** with payment challenge (USDC on Base Sepolia, payTo below)
- `redeem` a **fresh** paid tx → **200** `{"ok":true,...}`; the same tx again → **403 "payment already redeemed"**
- `buy` → full loop end-to-end

## On-chain artifacts (Base Sepolia)

| Contract | Address |
|---|---|
| `AgentShieldDemoEscrow` (verified source) | [`0x4eC3777B16FC7Da556B451679A10A8fDFC5Fd48D`](https://sepolia.basescan.org/address/0x4eC3777B16FC7Da556B451679A10A8fDFC5Fd48D#code) |
| USDC (Circle) | [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |

## Status

- [x] M0 — 402 skeleton + Hardhat tests (CI green)
- [x] M1 — live Base Sepolia payment verification (real USDC tx verified + replay rejected)
- [x] M2 — fulfillment + verified contract on Basescan + client script
- [ ] M3 — 90-second Loom walkthrough (demo gate)

## Structure

- `worker/` — Cloudflare Worker: x402 challenge + payment verification (Dev A)
- `contracts/` — Hardhat: escrow contract on Base Sepolia (Dev B)
- `client/` — agent script: challenge / pay / redeem / buy (Dev C)

## Deploy

Push to `main` deploys the worker via GitHub Actions (`.github/workflows/deploy-worker.yml`),
including D1 migrations. CI runs worker + Hardhat tests on every push/PR.
Contract deploys: `cd contracts && npx hardhat run scripts/deploy.js --network baseSepolia` (uses `.env`, never committed).

## License

MIT
