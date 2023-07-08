import Dexie, { Table } from "dexie";

export interface IEmail {
  email: string;
  provider: string;
  accessToken: string;
  expiresAt: number;
}

export interface IGoogleThread {
  id: string;
  historyId: string;
  email: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
}

export interface IGoogleMetadata {
  email: string;
  historyId: number;
  threadsListNextPageToken: string;
}

export class SubClassedDexie extends Dexie {
  emails!: Table<IEmail, string>;
  googleThreads!: Table<IGoogleThread, string>;
  googleMetadata!: Table<IGoogleMetadata, string>;

  constructor() {
    super("SpeedforceDB");
    this.version(1).stores({
      emails: "email, provider, accessToken, expiresAt",
      googleThreads: "id, historyId, email, from, subject, snippet",
      googleMetadata: "email, historyId, threadsListNextPageToken",
    });
  }
}

export const db = new SubClassedDexie();
