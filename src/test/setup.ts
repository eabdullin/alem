import "@testing-library/jest-dom";
import { vi } from "vitest";

const noopLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  errorHandler: { startCatching: vi.fn() },
  transports: {
    file: { level: false as const },
    console: { format: "", useStyles: false },
    ipc: { level: false as const },
  },
  initialize: vi.fn(),
};

vi.mock("electron-log/renderer", () => ({ default: noopLogger }));
vi.mock("electron-log/main", () => ({ default: noopLogger }));
