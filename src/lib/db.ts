import Dexie, { Table } from "dexie";
import { dexieSchemas } from "./dexie/schemas";

export interface IAttachment {
  // TODO: this is only for gmail, check what the microsoft equivalent is
  mimeType: string;
  filename: string;
  attachmentId: string;
  size: number;
}

export interface IEmail {
  email: string;
  provider: "google" | "outlook";
  accessToken: string;
  expiresAt: number;
}

export interface ISelectedEmail {
  id: number;
  email: string;
  provider: "google" | "outlook";
}

export interface IEmailThread {
  id: string;
  historyId: string;
  email: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
  labelIds: string[];
  hasAttachments: boolean;
}

export interface IMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  from: string;
  toRecipients: string[];
  snippet: string;
  headers: {
    name: string;
    value: string;
  }[];
  textData: string;
  htmlData: string;
  date: number;
  attachments: IAttachment[];
  // TODO: add more fields like cc, bcc, attachments, etc.
}

export interface IGoogleMetadata {
  email: string;
  historyId: string;
  threadsListNextPageTokens: {
    folderId: string; // TODO: reflect changes in SubClassedDexie
    token: string;
  }[];
}

export interface IOutlookMetadata {
  email: string;
  historyId: string;
  threadsListNextPageTokens: {
    folderId: string; // TODO: reflect changes in SubClassedDexie
    token: string;
  }[];
}

// Outlook messages do not contain folder names in response. Store names when fetching to avoid refetching unecessarily
export interface IOutlookFolder {
  id: string;
  displayName: string;
}

export interface IContact {
  email: string;
  contactName: string;
  contactEmailAddress: string;
  isSavedContact: boolean; // Store user's recent interactions with emails from unknown contacts
  lastInteraction: number; // Prioiritize contacts with recent interactions?
}

export interface IInboxZeroMetadata {
  email: string;
  inboxZeroStartDate: number;
}

export interface IDailyImageMetadata {
  id: number; // So we can select only one image
  date: string; // YYYY-MM-DD
  url: string;
}

export class SubClassedDexie extends Dexie {
  emails!: Table<IEmail, string>;
  selectedEmail!: Table<ISelectedEmail, number>;
  emailThreads!: Table<IEmailThread, string>;
  googleMetadata!: Table<IGoogleMetadata, string>;
  outlookMetadata!: Table<IOutlookMetadata, string>;
  messages!: Table<IMessage, string>;
  outlookFolders!: Table<IOutlookFolder, string>;
  contacts!: Table<IContact, string>;
  inboxZeroMetadata!: Table<IInboxZeroMetadata, string>;
  dailyImageMetadata!: Table<IDailyImageMetadata, number>;

  constructor() {
    super("SpeedforceDB");

    // Define schema versioning
    this.version(1).stores(dexieSchemas[1].schema);
    this.version(2)
      .stores(dexieSchemas[2].schema)
      .upgrade(dexieSchemas[2].upgradeFnc);
    this.version(3)
      .stores(dexieSchemas[3].schema)
      .upgrade(dexieSchemas[3].upgradeFnc);
    this.version(4)
      .stores(dexieSchemas[4].schema)
      .upgrade(dexieSchemas[4].upgradeFnc);
    this.version(5)
      .stores(dexieSchemas[5].schema)
      .upgrade(dexieSchemas[5].upgradeFnc);
  }
}

export const db = new SubClassedDexie();

// === String list column example Dexie ===
// Define your database schema
// const db = new Dexie('MyDatabase');
// db.version(1).stores({
//   myTable: 'id, stringList',
// });

// // Define your object store
// const myTable = db.table('myTable');

// // Example data
// const myData = {
//   id: 1,
//   stringList: ['string1', 'string2', 'string3']
// };

// // Insert the data into the database
// myTable.add(myData)
//   .then(() => {
//     console.log('Data added successfully');
//   })
//   .catch(error => {
//     console.error('Error adding data', error);
//   });

// === Get the rows that have a specific string in the stringList column ===
// Query the database for rows with 'string1' in the stringList column
// myTable.where('stringList').equals('string1').toArray()
//   .then(results => {
//     console.log(results);
//   })
//   .catch(error => {
//     console.error('Error retrieving data', error);
//   });
// OR
// myTable.where('stringList').startsWith('string1').toArray()
//   .then(results => {
//     console.log(results);
//   })
//   .catch(error => {
//     console.error('Error retrieving data', error);
//   });
