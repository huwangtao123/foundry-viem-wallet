import { readFile } from "node:fs/promises";
import { stderr } from "node:process";
import { ethers } from "ethers";
import { requiredEnv, resolveKeystorePassword } from "./secret.js";

function parseArgs(argv) {
  const cmd = (argv[0] || "sign").toLowerCase();
  if (cmd !== "sign" && cmd !== "send") {
    throw new Error("Usage: npm run agent -- sign|send");
  }
  return { cmd };
}

async function loadSigner() {
  const keystorePath = requiredEnv("AGENT_KEYSTORE_PATH");
  const password = await resolveKeystorePassword("Keystore password: ");
  const rpcUrl = requiredEnv("RPC_URL");

  const keystoreJson = await readFile(keystorePath, "utf8");
  const wallet = await ethers.Wallet.fromEncryptedJson(keystoreJson, password);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return wallet.connect(provider);
}

async function runSign() {
  const signer = await loadSigner();
  const message = `agent-sign:${new Date().toISOString()}`;
  const signature = await signer.signMessage(message);

  console.log("address:", await signer.getAddress());
  console.log("message:", message);
  console.log("signature:", signature);
  console.log("recovered:", ethers.verifyMessage(message, signature));
}

async function runSend() {
  const signer = await loadSigner();
  const to = requiredEnv("TO_ADDRESS");
  const amountEth = requiredEnv("SEND_AMOUNT_ETH");

  const tx = {
    to,
    value: ethers.parseEther(amountEth)
  };

  const res = await signer.sendTransaction(tx);
  console.log("tx_hash:", res.hash);

  const receipt = await res.wait();
  console.log("block:", receipt?.blockNumber);
  console.log("status:", receipt?.status);
}

async function main() {
  const { cmd } = parseArgs(process.argv.slice(2));
  if (cmd === "sign") {
    await runSign();
    return;
  }
  await runSend();
}

main().catch((err) => {
  const msg = err?.message || "";
  if (
    msg.includes("Missing") ||
    msg.includes("configuration") ||
    msg.includes("incorrect password")
  ) {
    stderr.write("Error: Invalid signer configuration or credentials.\n");
  } else {
    stderr.write("Error: Agent wallet operation failed.\n");
  }
  process.exit(1);
});
