import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type {
  ReadFileRequest,
  ReadFileResult,
} from "../../shared/tools/read-file/types";

export const readFileApi = {
  readFile: (input: ReadFileRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, input) as Promise<ReadFileResult>,
};
