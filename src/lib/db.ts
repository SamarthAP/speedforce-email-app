import Dexie, { Table } from "dexie";

export interface IEmail {
  email: string;
  provider: string;
  accessToken: string;
  expiresAt: number;
}

export interface ISelectedEmail {
  id: number;
  email: string;
  provider: string;
}

export interface IGoogleThread {
  id: string;
  historyId: string;
  email: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
}

export interface IGoogleMessage {
  id: string;
  // TODO: add more fields
}

export interface IGoogleMetadata {
  email: string;
  historyId: string;
  threadsListNextPageToken: string;
}

export class SubClassedDexie extends Dexie {
  emails!: Table<IEmail, string>;
  selectedEmail!: Table<ISelectedEmail, number>;
  googleThreads!: Table<IGoogleThread, string>;
  googleMetadata!: Table<IGoogleMetadata, string>;
  // TODO: add googleMessages table

  constructor() {
    super("SpeedforceDB");
    this.version(1).stores({
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      googleThreads:
        "id, historyId, email, from, subject, snippet, date, unread",
      googleMetadata: "email, historyId, threadsListNextPageToken",
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