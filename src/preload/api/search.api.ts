import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export interface SearchWebInput {
  query: string;
  providerId: string;
}

export interface SearchWebResult {
  results: Array<{ url: string; title?: string; snippet?: string }>;
}

export const searchApi = {
  searchWeb: (input: SearchWebInput) =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH_WEB, input) as Promise<SearchWebResult>,
};
