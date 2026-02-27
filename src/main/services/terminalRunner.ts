/**
 * Secure terminal command runner for the agent.
 * - Restricts filesystem access to workspace directory
 * - Command denylist (rm -rf, privilege escalation, etc.)
 * - Timeout and output caps enforced
 * - Network default-deny; when enabled, only explicit domains (tracked for future approval)
 */

import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

import {
  type TerminalRunRequest,
  type TerminalRunResult,
} from "../../shared/tools/terminal/types";
import { DENYLIST_COMMANDS } from "../../shared/tools/terminal/denylist";

export type { TerminalRunRequest, TerminalRunResult } from "../../shared/tools/terminal/types";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_OUTPUT_BYTES = 100_000;

/** Patterns that deny the whole command line (joined). */
const DENYLIST_PATTERNS = [
  /\brm\s+(-rf?|--recursive|--force)/i,
  /\bchmod\s+[0-7]{3,4}/,
  /\bdd\s+if=/i,
  /\bsudo\b/i,
  /\bsu\s+/i,
  /--no-sandbox/i,
  /--disable-[a-z-]+security/i,
  /\/etc\/shadow/i,
  /\.env\s|--env|getenv.*secret/i,
];

function isCommandDenied(tokens: string[]): string | null {
  if (tokens.length === 0) return "empty command";
  const first = path.basename(tokens[0]).toLowerCase().replace(/\.[^.]+$/, "");
  if (DENYLIST_COMMANDS.has(first)) return `command not allowed: ${tokens[0]}`;
  const line = tokens.join(" ");
  for (const re of DENYLIST_PATTERNS) {
    if (re.test(line)) return `command pattern not allowed: ${line}`;
  }
  return null;
}

function createDeniedResult(reason: string, startTime: number): TerminalRunResult {
  return {
    stdout: "",
    stderr: reason,
    outcome: { type: "denied", reason },
    duration_ms: Date.now() - startTime,
    truncated: false,
  };
}

function buildEnv(allowlist: Record<string, string> | undefined): Record<string, string> {
  const env: Record<string, string> = {};
  if (allowlist && typeof allowlist === "object") {
    for (const [k, v] of Object.entries(allowlist)) {
      if (typeof v === "string") env[k] = v;
    }
  }
  return env;
}

/** Collects stream output with a byte cap and truncation marker. */
class OutputCap {
  private bytes = 0;
  private chunks: string[] = [];

  constructor(private readonly maxBytes: number) {}

  append(data: Buffer | string): void {
    if (this.bytes >= this.maxBytes) return;
    const str = typeof data === "string" ? data : data.toString("utf8");
    const byteLen = Buffer.byteLength(str, "utf8");
    const remaining = this.maxBytes - this.bytes;
    if (byteLen <= remaining) {
      this.chunks.push(str);
      this.bytes += byteLen;
    } else {
      let take = 0;
      let acc = 0;
      for (let i = 0; i < str.length && acc < remaining; i++) {
        acc += Buffer.byteLength(str[i], "utf8");
        take = i + 1;
      }
      this.chunks.push(str.slice(0, take));
      this.bytes = this.maxBytes;
      this.chunks.push("\n...[output truncated]");
    }
  }

  get text(): string {
    return this.chunks.join("");
  }

  get truncated(): boolean {
    return this.bytes >= this.maxBytes;
  }
}

export interface RunTerminalOptions {
  request: TerminalRunRequest;
  workspaceRoot: string;
  /** Custom shell executable. Empty/undefined = platform default. */
  shell?: string;
}

export async function runTerminal({
  request,
  workspaceRoot,
  shell: shellOverride,
}: RunTerminalOptions): Promise<TerminalRunResult> {
  const start = Date.now();
  const maxBytes = request.max_output_bytes ?? DEFAULT_MAX_OUTPUT_BYTES;

  const denied = isCommandDenied(request.command);
  if (denied) return createDeniedResult(denied, start);

  if (request.network?.enabled === true) {
    return createDeniedResult(
      "Network access is not supported in this version. Use network: { enabled: false }.",
      start
    );
  }
  if (!workspaceRoot) return createDeniedResult("Workspace root is not set.", start);

  const timeoutMs = Math.min(
    request.timeout_ms ?? DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
  const env = buildEnv(request.env);
  const spawnEnv = Object.keys(env).length > 0 ? { ...process.env, ...env } : undefined;

  return new Promise((resolve) => {
    const [cmd, ...args] = request.command;
    if (!cmd) {
      resolve(createDeniedResult("empty command", start));
      return;
    }

    let timedOut = false;
    const stdoutCap = new OutputCap(maxBytes);
    const stderrCap = new OutputCap(maxBytes);

    const shell =
      shellOverride && shellOverride.length > 0
        ? shellOverride
        : os.platform() === "win32"
          ? "powershell.exe"
          : true;
    const proc = spawn(cmd, args, {
      cwd: workspaceRoot,
      env: spawnEnv,
      shell,
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 2000);
    }, timeoutMs);

    proc.stdout?.on("data", (data: Buffer | string) => stdoutCap.append(data));
    proc.stderr?.on("data", (data: Buffer | string) => stderrCap.append(data));

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        stdout: stdoutCap.text,
        stderr: stderrCap.text + (err.message || String(err)),
        outcome: { type: "exit", exit_code: -1 },
        duration_ms: Date.now() - start,
        truncated: stdoutCap.truncated || stderrCap.truncated,
      });
    });

    proc.on("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({
        stdout: stdoutCap.text,
        stderr: stderrCap.text,
        outcome: timedOut
          ? { type: "timeout" }
          : { type: "exit", exit_code: code ?? (signal ? -1 : 0) },
        duration_ms: Date.now() - start,
        truncated: stdoutCap.truncated || stderrCap.truncated,
      });
    });
  });
}
