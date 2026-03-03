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

Required fields in `.env` (direct password mode):
- `AGENT_KEYSTORE_PATH` = keystore path from Step 1
- `AGENT_KEYSTORE_PASSWORD` = password used during generation
- `RPC_URL` = chain RPC endpoint

Recommended fields for local split-secret mode:
- `AGENT_KEYSTORE_PATH`
- `RPC_URL`
- `AGENT_KEY_PART_A`
- `AGENT_KEY_PART_B`
- `AGENT_KEY_DERIVE_SALT`
- `REQUIRE_DOPPLER_SPLIT=1` (default policy)

Note:
- split-secret mode is now the default.
- if split-secret vars are missing, command will fail.
- only set `REQUIRE_DOPPLER_SPLIT=0` if you intentionally want legacy fallback.

Optional runtime input:
- if `AGENT_KEY_PART_B` is not set, script will prompt for it interactively

Optional (only for send):
- `TO_ADDRESS`
- `SEND_AMOUNT_ETH`

## Step 3: Agent sign test
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
set -a; source .env; set +a
npm run agent -- sign
```

Optional with Doppler as env injector:
`doppler run -- npm run agent -- sign`

Success criteria:
- output has `address`, `signature`, `recovered`
- `address == recovered`

## Step 4: Agent send tx (optional)
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
set -a; source .env; set +a
npm run agent -- send
```

Optional with Doppler as env injector:
`doppler run -- npm run agent -- send`

Success criteria:
- output has `tx_hash`
- receipt `status` is `1`

## Security Rules (must follow)
- Never print or store raw private key.
- Never pass private key in CLI args.
- Keep keystore file permission `600`, directory `700`.
- Keep wallet password only in process env/secret manager.
- Prefer split-secret mode: `PART_A + PART_B + SALT` in local env/secret manager.
- Use low-balance wallet for demo.

## Security boundary (must read)
1. Guaranteed
- private key is not stored as plaintext on disk
- keystore can be unlocked using split-derived password (`PART_A + PART_B + SALT`)

2. Not guaranteed
- if one runtime can read all `PART_A/PART_B/SALT`, it can decrypt and sign
- this is not HSM/KMS isolation

3. Main risk
- putting all three parts in one environment concentrates risk in that environment

4. Stronger model
- use KMS/HSM/MPC signer so agent only receives signatures, not decryption material

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
