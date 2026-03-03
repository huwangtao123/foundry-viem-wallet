# Agent Wallet Runbook (Direct Use)

## Goal
Create a local encrypted wallet and let the agent sign/send transactions without exposing raw private key.

## Preconditions
- Node.js >= 18
- Project path: `/Users/taowang/workspace/Agents/foundry-viem-wallet`

## One-time Setup
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
npm install
```

## Step 1: Generate encrypted wallet
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
npm run generate -- --name my-agent
```

Expected output contains:
- `Address: 0x...`
- `Keystore path: .../my-agent`

## Step 2: Configure runtime env
Create `.env` from template and fill values.

```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
cp .env.example .env
```

Required fields in `.env`:
- `AGENT_KEYSTORE_PATH` = keystore path from Step 1
- `AGENT_KEYSTORE_PASSWORD` = password used during generation
- `RPC_URL` = chain RPC endpoint

Optional (only for send):
- `TO_ADDRESS`
- `SEND_AMOUNT_ETH`

## Step 3: Agent sign test
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
set -a; source .env; set +a
npm run agent -- sign
```

Success criteria:
- output has `address`, `signature`, `recovered`
- `address == recovered`

## Step 4: Agent send tx (optional)
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
set -a; source .env; set +a
npm run agent -- send
```

Success criteria:
- output has `tx_hash`
- receipt `status` is `1`

## Security Rules (must follow)
- Never print or store raw private key.
- Never pass private key in CLI args.
- Keep keystore file permission `600`, directory `700`.
- Keep wallet password only in process env/secret manager.
- Use low-balance wallet for demo.

## Troubleshooting
- `Missing env: ...`: fill missing keys in `.env`.
- RPC timeout: switch `RPC_URL` to a stable endpoint.
- `insufficient funds`: top up testnet token before `send`.

## Machine-readable checklist
```yaml
agent_wallet_flow:
  install: done_when_npm_install_success
  generate: done_when_keystore_path_and_address_present
  config: done_when_env_has_required_fields
  sign: done_when_address_equals_recovered
  send_optional: done_when_tx_hash_present_and_status_1
```
