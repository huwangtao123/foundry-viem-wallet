import { stderr } from "node:process";
import { mkdir, open } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { encryptKeystoreJson } from "ethers";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { resolveKeystorePassword } from "./secret.js";

function usage() {
  console.log(
    "Usage: npm run generate -- --name <account-name> [--keystore-dir <path>]"
  );
}

function parseArgs(argv) {
  const args = { name: "agent-wallet" };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--name") {
      args.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "--keystore-dir") {
      args.keystoreDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "-h" || a === "--help") {
      usage();
      process.exit(0);
    }
    throw new Error(`Unknown arg: ${a}`);
  }

  if (!args.name || !args.name.trim()) {
    throw new Error("--name cannot be empty");
  }

  return args;
}

async function writeSecureFile(path, contents) {
  const fh = await open(path, "wx", 0o600);
  try {
    await fh.writeFile(contents, { encoding: "utf8" });
  } finally {
    await fh.close();
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const keystoreDir =
    args.keystoreDir || join(homedir(), ".foundry", "keystores");

  if (process.env.WALLET_PASSWORD && !process.env.AGENT_KEYSTORE_PASSWORD) {
    process.env.AGENT_KEYSTORE_PASSWORD = process.env.WALLET_PASSWORD;
  }

  const password = await resolveKeystorePassword("Set keystore password: ");
  if (!password) {
    throw new Error("Password cannot be empty");
  }

  let privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const rawKeystoreJson = await encryptKeystoreJson(
    {
      address: account.address,
      privateKey
    },
    password,
    {
      scrypt: { N: 1 << 17, r: 8, p: 1 }
    }
  );
  const keystoreObj = JSON.parse(rawKeystoreJson);
  if (keystoreObj.Crypto && !keystoreObj.crypto) {
    keystoreObj.crypto = keystoreObj.Crypto;
    delete keystoreObj.Crypto;
  }
  const keystoreJson = JSON.stringify(keystoreObj);

  // Best-effort wipe of private key reference in JS memory.
  privateKey = "0x";

  await mkdir(keystoreDir, { recursive: true, mode: 0o700 });
  const keystorePath = join(keystoreDir, args.name);
  await writeSecureFile(keystorePath, `${keystoreJson}\n`);

  console.log("Wallet created and encrypted in Foundry keystore format.");
  console.log(`Account name: ${args.name}`);
  console.log(`Address: ${account.address}`);
  console.log(`Keystore path: ${keystorePath}`);
  if (args.keystoreDir) {
    console.log(`Use with Foundry: cast wallet address --keystore ${keystorePath}`);
  } else {
    console.log(`Use with Foundry: cast wallet address --account ${args.name}`);
  }
}

run().catch((err) => {
  stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
