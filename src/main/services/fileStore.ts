import { app, shell } from "electron";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type Store from "electron-store";

interface FileStoreAttachmentRecord {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  relativePath: string;
  createdAt: string;
}

type FileStoreAttachmentMap = Record<string, FileStoreAttachmentRecord>;

export interface SaveAttachmentInput {
  name: string;
  mediaType?: string;
  dataBase64: string;
}

export interface StoredAttachment {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  createdAt: string;
}

const ATTACHMENTS_DIR_NAME = "chat-attachments";
const ATTACHMENTS_STORE_KEY = "attachments";

function toStoredAttachment(record: FileStoreAttachmentRecord): StoredAttachment {
  return {
    id: record.id,
    name: record.name,
    mediaType: record.mediaType,
    size: record.size,
    createdAt: record.createdAt,
  };
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name || "attachment");
  const sanitized = base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim();
  return sanitized || "attachment";
}

function normalizeMediaType(mediaType?: string): string {
  const value = mediaType?.trim();
  return value || "application/octet-stream";
}

function createAttachmentFileName(id: string, name: string): string {
  return `${id}-${sanitizeFileName(name)}`;
}

export class ElectronFileStore {
  constructor(private readonly store: Store) {}

  private getAttachmentsDirectory(): string {
    return path.join(app.getPath("userData"), ATTACHMENTS_DIR_NAME);
  }

  private getAttachmentMap(): FileStoreAttachmentMap {
    return this.store.get(ATTACHMENTS_STORE_KEY, {}) as FileStoreAttachmentMap;
  }

  private setAttachmentMap(map: FileStoreAttachmentMap): void {
    this.store.set(ATTACHMENTS_STORE_KEY, map);
  }

  private async ensureDirectoryExists(): Promise<void> {
    await fs.mkdir(this.getAttachmentsDirectory(), { recursive: true });
  }

  private getAttachmentAbsolutePath(attachmentId: string): string {
    const map = this.getAttachmentMap();
    const record = map[attachmentId];

    if (!record) {
      throw new Error("Attachment not found.");
    }

    return path.join(this.getAttachmentsDirectory(), record.relativePath);
  }

  async saveAttachment(input: SaveAttachmentInput): Promise<StoredAttachment> {
    const id = randomUUID();
    const fileName = createAttachmentFileName(id, input.name);
    const directory = this.getAttachmentsDirectory();
    const absolutePath = path.join(directory, fileName);
    const content = Buffer.from(input.dataBase64, "base64");
    const createdAt = new Date().toISOString();

    await this.ensureDirectoryExists();
    await fs.writeFile(absolutePath, content);

    const record: FileStoreAttachmentRecord = {
      id,
      name: sanitizeFileName(input.name),
      mediaType: normalizeMediaType(input.mediaType),
      size: content.byteLength,
      relativePath: fileName,
      createdAt,
    };

    const map = this.getAttachmentMap();
    map[id] = record;
    this.setAttachmentMap(map);

    return toStoredAttachment(record);
  }

  async readAttachment(attachmentId: string): Promise<string> {
    const absolutePath = this.getAttachmentAbsolutePath(attachmentId);
    const content = await fs.readFile(absolutePath);
    return content.toString("base64");
  }

  async openAttachment(attachmentId: string): Promise<boolean> {
    const absolutePath = this.getAttachmentAbsolutePath(attachmentId);
    const result = await shell.openPath(absolutePath);
    if (result) {
      throw new Error(result);
    }

    return true;
  }

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const map = this.getAttachmentMap();
    const record = map[attachmentId];

    if (!record) {
      return false;
    }

    const absolutePath = path.join(this.getAttachmentsDirectory(), record.relativePath);
    await fs.rm(absolutePath, { force: true });

    delete map[attachmentId];
    this.setAttachmentMap(map);

    return true;
  }
}
