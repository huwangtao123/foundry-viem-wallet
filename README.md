# Secure Agent Wallet (Beginner Guide)
# 安全 Agent 钱包（新手指南）

This project helps you create a wallet that an agent can use directly, without exposing raw private key.
本项目帮助你创建一个可被 agent 直接使用的钱包，同时避免暴露原始私钥。

## Three implementation options
## 三种实现方案

### Option 1 (current project, recommended): Pure Node local keystore
### 方案 1（当前仓库实现，推荐）：纯 Node 本地 keystore
- Flow: `viem` generates key in memory -> `ethers` encrypts keystore JSON -> agent decrypts in memory to sign/send.
- 流程：`viem` 在内存生成私钥 -> `ethers` 加密为 keystore JSON -> agent 在内存解密并签名/发交易。
- Pros: easiest, ARM64-friendly, minimal dependencies, fast demo.
- 优点：最轻量、ARM64 友好、依赖少、demo 上手快。
- Cons: key still lives on your machine (encrypted at rest, but local custody).
- 缺点：密钥仍由本地托管（落盘是加密的，但仍是本地保管）。

### Option 2: Node + Foundry verification
### 方案 2：Node + Foundry 校验
- Flow: same as Option 1, plus optional `cast` commands to verify keystore/address.
- 流程：与方案 1 相同，额外可用 `cast` 校验 keystore/地址。
- Pros: good if you already use Foundry.
- 优点：适合已在用 Foundry 的工作流。
- Cons: extra tool dependency; not required for runtime.
- 缺点：多一个工具依赖，运行时其实不必需。

### Option 3: KMS/HSM/MPC (production-grade)
### 方案 3：KMS/HSM/MPC（生产级）
- Flow: private key never stored locally; agent requests signatures from a secure signer service.
- 流程：私钥不落本地；agent 向安全签名服务请求签名。
- Pros: strongest security posture, policy control, auditability.
- 优点：安全性最高，可做策略管控和审计。
- Cons: higher setup and integration cost.
- 缺点：接入复杂度和成本更高。

## What this repo implements
## 本仓库实现内容

This repo implements **Option 1**.
本仓库实现的是 **方案 1**。

- Generate: [src/generate.js](/Users/taowang/workspace/Agents/foundry-viem-wallet/src/generate.js)
- Agent runtime: [src/agent-use.js](/Users/taowang/workspace/Agents/foundry-viem-wallet/src/agent-use.js)
- Env template: [.env.example](/Users/taowang/workspace/Agents/foundry-viem-wallet/.env.example)
- Agent runbook: [AGENT_WALLET.md](/Users/taowang/workspace/Agents/foundry-viem-wallet/AGENT_WALLET.md)

## Prerequisites
## 前置条件

- Node.js 18+
- Foundry (`cast`) optional (verification only)
- Foundry（`cast`）可选，仅用于校验

## Beginner quickstart (Option 1)
## 新手快速开始（方案 1）

### 1) Install
### 1）安装依赖

```bash
cd /Users/taowang/workspace/Agents/foundry-viem-wallet
npm install
```

### 2) Generate encrypted wallet
### 2）生成加密钱包

```bash
npm run generate -- --name my-agent
```

You will see:
你会看到：
- `Address: 0x...`
- `Keystore path: .../my-agent`

Optional non-interactive mode:
可选：非交互模式（适合自动化）

```bash
WALLET_PASSWORD='your-strong-password' npm run generate -- --name my-agent
```

Optional custom keystore directory:
可选：自定义 keystore 目录

```bash
npm run generate -- --name my-agent --keystore-dir /path/to/keystores
```

### 3) Configure agent env
### 3）配置 agent 环境变量

```bash
cp .env.example .env
```

Edit `.env`:
编辑 `.env`：
- `AGENT_KEYSTORE_PATH` = keystore path from step 2
- `AGENT_KEYSTORE_PATH` = 第 2 步输出的 keystore 路径
- `AGENT_KEYSTORE_PASSWORD` = wallet password from step 2
- `AGENT_KEYSTORE_PASSWORD` = 第 2 步设置的钱包密码
- `RPC_URL` = your chain RPC
- `RPC_URL` = 链的 RPC 地址

Optional for send:
发送交易时额外需要：
- `TO_ADDRESS`
- `SEND_AMOUNT_ETH`

### 4) Let agent sign (smoke test)
### 4）让 agent 先签名（烟测）

```bash
set -a; source .env; set +a
npm run agent -- sign
```

Success signal:
成功标志：
- output includes `address`, `signature`, `recovered`
- 输出包含 `address`、`signature`、`recovered`
- `address` equals `recovered`
- `address` 与 `recovered` 一致

### 5) Let agent send tx (optional, testnet)
### 5）让 agent 发交易（可选，建议测试网）

```bash
set -a; source .env; set +a
npm run agent -- send
```

## Optional Foundry verification (Option 2 style)
## 可选 Foundry 校验（方案 2 风格）

```bash
cast wallet list
cast wallet address --account my-agent
# or with custom dir:
cast wallet address --keystore /path/to/keystores/my-agent
```

## Security model (important)
## 安全模型（重点）

- Raw private key is generated in memory and never printed.
- 原始私钥只在内存生成，不会打印。
- Raw private key is not passed in CLI args.
- 原始私钥不会出现在命令行参数中。
- Keystore file is encrypted JSON, written with restrictive permissions.
- keystore 文件为加密 JSON，并使用严格文件权限写入。
- `.env` is ignored by git (see [.gitignore](/Users/taowang/workspace/Agents/foundry-viem-wallet/.gitignore)).
- `.env` 已被 git 忽略（见 [.gitignore](/Users/taowang/workspace/Agents/foundry-viem-wallet/.gitignore)）。

## Common issues
## 常见问题

- `Missing env: ...`: fill missing fields in `.env`.
- `Missing env: ...`：补齐 `.env` 中缺失字段。
- `insufficient funds`: fund the wallet on testnet before `send`.
- `insufficient funds`：先给测试网钱包充值再执行 `send`。
- RPC errors/timeouts: replace `RPC_URL` with a stable endpoint.
- RPC 超时/报错：更换更稳定的 `RPC_URL`。

