# Foundry + viem Secure Wallet Generator

One-command local flow:
- Generate private key using `viem` (in memory)
- Encrypt as Foundry-compatible keystore JSON locally
- Save to Foundry keystore directory with `600` file permission
- Output only address and keystore location

## Requirements

- Node.js 18+
- Foundry (`cast`) optional (only for keystore verification with cast commands)

## Install

```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
npm install
```

## Generate wallet

```bash
npm run generate -- --name my-agent
```

Optional (non-interactive): set `WALLET_PASSWORD` env before running generate.

Optional custom keystore directory:

```bash
npm run generate -- --name my-agent --keystore-dir /path/to/keystores
```

Verify with Foundry:

```bash
cast wallet list
cast wallet address --account my-agent
# if you used --keystore-dir:
cast wallet address --keystore /path/to/keystores/my-agent
```

If you do not have Foundry (or on minimal ARM64 env), you can skip this section.

## Use in agent directly

1) Prepare env:

```bash
cp .env.example .env
```

2) Edit `.env` and set:
- `AGENT_KEYSTORE_PATH`
- `AGENT_KEYSTORE_PASSWORD`
- `RPC_URL`

3) Run sign flow:

```bash
set -a; source .env; set +a
npm run agent -- sign
```

4) Run send flow (testnet):

```bash
set -a; source .env; set +a
npm run agent -- send
```

## Security notes

- Private key is generated in memory and never printed.
- Private key is not placed in shell history, CLI args, or intermediate files.
- Keystore is standard encrypted JSON and can be used by Foundry tooling.
- The generate and agent scripts themselves do not depend on Foundry.
- Do not commit `.env` (repository includes `.gitignore` for this).
- Use a dedicated low-fund wallet for demos.
- Back up your keystore file and password separately.
