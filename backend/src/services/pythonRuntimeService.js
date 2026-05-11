import { spawn } from "node:child_process";
import env from "../config/env.js";

function runPythonCompile(code, executable) {
  return new Promise((resolve) => {
    let process;

    try {
      process = spawn(executable, ["-c", "import sys; compile(sys.stdin.read(), '<input>', 'exec')"], {
        stdio: ["pipe", "ignore", "pipe"]
      });
    } catch (_error) {
      resolve({ ok: false, unavailable: true, error: "Python runtime not available." });
      return;
    }

    let stderr = "";

    process.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    process.on("error", () => {
      resolve({ ok: false, unavailable: true, error: "Python runtime not available." });
    });

    process.on("close", (codeValue) => {
      if (codeValue === 0) {
        resolve({ ok: true });
        return;
      }

      resolve({
        ok: false,
        unavailable: false,
        error: stderr.trim() || "Python reported a syntax error."
      });
    });

    process.stdin.write(code);
    process.stdin.end();
  });
}

export async function checkPythonSyntax(code) {
  const primaryResult = await runPythonCompile(code, env.pythonBin);

  if (primaryResult.ok || !primaryResult.unavailable) {
    return primaryResult;
  }

  return runPythonCompile(code, "python3");
}
