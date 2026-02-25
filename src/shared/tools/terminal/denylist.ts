/**
 * Terminal command denylist shared between main process (runner) and renderer (tool description).
 * No Node.js imports – safe for browser bundling.
 */

/** Lowercase command (or first token) for denylist. */
export const DENYLIST_COMMANDS = new Set([
  "rm",
  "sudo",
  "su",
  "chmod",
  "chown",
  "passwd",
  "mkfs",
  "dd",
  "nc",
  "netcat",
  "ncat",
  "ssh",
  "scp",
  "sftp",
  "eval",
]);
