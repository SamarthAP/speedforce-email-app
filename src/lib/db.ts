import Dexie, { Table } from "dexie";

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
}

export interface IMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  from: string;
  to: string; // TODO: what if more than one recipient?
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
  threadsListNextPageTokens: {
    folderId: string; // TODO: reflect changes in SubClassedDexie
    historyId: string;
    token: string;
  }[];
}

export interface IOutlookMetadata {
  email: string;
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

export class SubClassedDexie extends Dexie {
  emails!: Table<IEmail, string>;
  selectedEmail!: Table<ISelectedEmail, number>;
  emailThreads!: Table<IEmailThread, string>;
  googleMetadata!: Table<IGoogleMetadata, string>;
  outlookMetadata!: Table<IOutlookMetadata, string>;
  messages!: Table<IMessage, string>;
  outlookFolders!: Table<IOutlookFolder, string>;

  constructor() {
    super("SpeedforceDB");
    this.version(1).stores({
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, labelIds",
      googleMetadata: "email, threadsListNextPageTokens",
      outlookMetadata: "email, threadsListNextPageTokens",
      messages:
        "id, threadId, labelIds, from, to, snippet, headers, textData, htmlData, date, attachments",
      outlookFolders: "id, displayName",
    });
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
