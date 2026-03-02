import { ipcMain } from "electron";
import { fetchUrl } from "../services/fetchService";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export function registerFetchIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.FETCH_URL,
    async (_event, input: { url: string }) => {
      const { url } = input;
      if (!url?.trim()) {
        throw new Error("URL is required.");
      }
      return fetchUrl(url.trim());
    }
  );
}
