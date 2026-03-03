# AGENT_WALLET

## Purpose
Generate and use an encrypted wallet with split-secret config.

## Prerequisites
- Node.js 18+
- Project path: `/Users/taowang/workspace/Agents/foundry-viem-wallet`

## Required config
Set these before running:
- `AGENT_KEYSTORE_PATH`
- `RPC_URL`
- `AGENT_KEY_PART_A`
- `AGENT_KEY_DERIVE_SALT`
- `REQUIRE_DOPPLER_SPLIT=1`

Runtime input:
- `KEY_PART_B` must be entered interactively when prompted.

Optional:
- `TO_ADDRESS`
- `SEND_AMOUNT_ETH`

## Commands
Install:
```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
npm install
```

Generate wallet:
```bash
npm run generate -- --name my-agent
```

Sign test:
```bash
npm run agent -- sign
```

Send tx (optional):
```bash
npm run agent -- send
```

## Success checks
- Generate: output includes `Address` and `Keystore path`
- Sign: `address == recovered`
- Send: output includes `tx_hash` and receipt `status: 1`

## Security boundary
- Private key is not stored as plaintext on disk.
- Keystore password is derived from `PART_A + PART_B + SALT`.
- If one runtime can read all three parts, it can decrypt and sign.
- For stronger isolation, use KMS/HSM/MPC signer.

## Do not
- Do not print private key.
- Do not commit real secrets.
- Do not run high-balance funds in this model.
