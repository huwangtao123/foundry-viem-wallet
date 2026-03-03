import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { execFileSync } from "node:child_process";
import { scryptSync } from "node:crypto";

export function requiredEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error("Missing required configuration.");
  }
  return v.trim();
}

export async function promptHidden(promptText) {
  if (!input.isTTY || !output.isTTY) {
    throw new Error("TTY required for hidden input.");
  }

  return new Promise((resolve) => {
    const rl = createInterface({ input, output, terminal: true });
    let echoDisabled = false;
    let restored = false;

    const restoreEcho = () => {
      if (!echoDisabled || restored) return;
      try {
        execFileSync("stty", ["echo"], { stdio: "inherit" });
      } catch (_err) {
        // Best-effort restore.
      }
      restored = true;
    };

    try {
      execFileSync("stty", ["-echo"], { stdio: "inherit" });
      echoDisabled = true;
    } catch (_err) {
      // Continue even if echo toggle is unavailable.
    }

    rl.question(promptText, (answer) => {
      restoreEcho();
      rl.close();
      output.write("\n");
      resolve(answer);
    });

    rl.on("SIGINT", () => {
      restoreEcho();
      rl.close();
      process.exit(130);
    });
  });
}

function derivePassword(partA, partB, salt) {
  const material = `${partA}:${partB}`;
  const derived = scryptSync(material, salt, 32, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  });
  return `v1:${derived.toString("hex")}`;
}

export async function resolveKeystorePassword(promptText = "Keystore password: ") {
  // Default policy: split-secret mode is required unless explicitly disabled.
  const requireSplit = process.env.REQUIRE_DOPPLER_SPLIT !== "0";
  const partA = process.env.AGENT_KEY_PART_A;
  const salt = process.env.AGENT_KEY_DERIVE_SALT;

  if (partA && !salt) {
    throw new Error("Split-secret configuration is incomplete.");
  }
  if (!partA && salt) {
    throw new Error("Split-secret configuration is incomplete.");
  }

  if (partA && partA.trim()) {
    const partBFromEnv = process.env.AGENT_KEY_PART_B;
    if (partBFromEnv && partBFromEnv.trim()) {
      throw new Error("AGENT_KEY_PART_B must be provided interactively.");
    }
    const partB = await promptHidden("User passphrase (KEY_PART_B): ");
    if (!partB || !partB.trim()) {
      throw new Error("KEY_PART_B cannot be empty");
    }

    const password = derivePassword(partA.trim(), partB.trim(), salt.trim());
    process.env.AGENT_KEY_PART_B = "";
    return password;
  }

  if (requireSplit) {
    throw new Error(
      "Split-secret mode is enabled by default, but required configuration is missing."
    );
  }

  const direct = process.env.AGENT_KEYSTORE_PASSWORD;
  if (direct && direct.trim()) {
    return direct.trim();
  }

  return (await promptHidden(promptText)).trim();
}
