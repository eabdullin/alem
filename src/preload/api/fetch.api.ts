import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export interface FetchUrlInput {
  url: string;
}

export interface FetchUrlResult {
  content: string;
  url: string;
  truncated?: boolean;
}

export const fetchApi = {
  fetchUrl: (input: FetchUrlInput) =>
    ipcRenderer.invoke(IPC_CHANNELS.FETCH_URL, input) as Promise<FetchUrlResult>,
};
