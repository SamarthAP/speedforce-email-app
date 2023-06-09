import { ElectronHandler } from "./preload";

// Note: Equally named files, that only differ in their .ts/.d.ts extension, do not work.
// Example: electron.d.ts and electron.ts. Only one of them will be used.

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
  }
}

export {};
