import { describe, it, expect } from "vitest";
import { DENYLIST_COMMANDS } from "./denylist";

describe("DENYLIST_COMMANDS", () => {
  it("is a Set", () => {
    expect(DENYLIST_COMMANDS).toBeInstanceOf(Set);
  });

  it("contains dangerous commands in lowercase", () => {
    expect(DENYLIST_COMMANDS.has("rm")).toBe(true);
    expect(DENYLIST_COMMANDS.has("sudo")).toBe(true);
    expect(DENYLIST_COMMANDS.has("chmod")).toBe(true);
    expect(DENYLIST_COMMANDS.has("dd")).toBe(true);
  });

  it("contains shell commands", () => {
    expect(DENYLIST_COMMANDS.has("bash")).toBe(true);
    expect(DENYLIST_COMMANDS.has("sh")).toBe(true);
    expect(DENYLIST_COMMANDS.has("powershell")).toBe(true);
    expect(DENYLIST_COMMANDS.has("cmd")).toBe(true);
  });

  it("contains network/remote commands", () => {
    expect(DENYLIST_COMMANDS.has("ssh")).toBe(true);
    expect(DENYLIST_COMMANDS.has("nc")).toBe(true);
    expect(DENYLIST_COMMANDS.has("netcat")).toBe(true);
  });

  it("does not contain safe commands", () => {
    expect(DENYLIST_COMMANDS.has("ls")).toBe(false);
    expect(DENYLIST_COMMANDS.has("cat")).toBe(false);
    expect(DENYLIST_COMMANDS.has("git")).toBe(false);
    expect(DENYLIST_COMMANDS.has("echo")).toBe(false);
  });
});
