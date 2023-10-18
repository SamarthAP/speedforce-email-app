import { Transaction } from "dexie";

export const dexieSchemas = {
  /*
  Schema Version 1:
  Oldest Compatible App Version 0.0.1
  */
  1: {
    schema: {
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, labelIds",
      googleMetadata: "email, threadsListNextPageTokens",
      outlookMetadata: "email, threadsListNextPageTokens",
      messages:
        "id, threadId, labelIds, from, to, snippet, headers, textData, htmlData, date, attachments",
      outlookFolders: "id, displayName",
    },
  },

  /*
  Schema Version 2:
  Oldest Compatible App Version 0.0.4
  Change description:
    - Add support for multiple recipients
    - Explicitly declare arrays indices
  */
  2: {
    schema: {
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds",
      googleMetadata: "email, *threadsListNextPageTokens",
      outlookMetadata: "email, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
    },
    upgradeFnc: async (tx: Transaction) => {
      console.log("Upgrading schema to version 2");

      // Test upgrade function: map single recipient to array type
      return tx
        .table("messages")
        .toCollection()
        .modify((message) => {
          if (message.to) {
            message.toRecipients = [message.to];
            delete message.to;
          }
        });
    },
  },

  /*
  Schema Version 3:
  Oldest Compatible App Version 0.0.5
  Change description:
    - Add support for attaching files to emails
  */
  3: {
    schema: {
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments",
      googleMetadata: "email, *threadsListNextPageTokens",
      outlookMetadata: "email, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
    },
    upgradeFnc: async (tx: Transaction) => {
      console.log("Upgrading schema to version 3");

      // set hasAttachments to false for all emailThreads
      return tx
        .table("emailThreads")
        .toCollection()
        .modify((emailThread) => {
          emailThread.hasAttachments = false;
        });
    },
  },
};
