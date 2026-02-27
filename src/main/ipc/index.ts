import { registerShellIpc } from "./shell.ipc";
import { registerAppIpc } from "./app.ipc";
import { registerTerminalIpc } from "./terminal.ipc";
import { registerBrowserIpc } from "./browser.ipc";
import { registerFilePatchIpc } from "./filePatch.ipc";
import { registerUpdateIpc } from "./update.ipc";

export function registerAllIpc(): void {
  registerShellIpc();
  registerAppIpc();
  registerTerminalIpc();
  registerBrowserIpc();
  registerFilePatchIpc();
  registerUpdateIpc();
}
