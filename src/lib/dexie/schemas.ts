import { Transaction } from "dexie";
import { dLog } from "../noProd";
import { cleanIndexedDb } from "../experiments";
import { decodeGoogleMessageData } from "../util";

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
      dLog("Upgrading schema to version 2");

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
      googleMetadata: "email, historyId, *threadsListNextPageTokens",
      outlookMetadata: "email, historyId, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 3");

      // this is the initial change but we just decided to delete the whole db
      // set hasAttachments to false for all emailThreads
      // return tx
      //   .table("emailThreads")
      //   .toCollection()
      //   .modify((emailThread) => {
      //     emailThread.hasAttachments = false;
      //   });
      cleanIndexedDb();
    },
  },

  /*
  Schema Version 4:
  Oldest Compatible App Version 0.0.10
  Change description:
    - Add contacts table - quick lookup for search suggestions
  */
  4: {
    schema: {
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments",
      googleMetadata: "email, historyId, *threadsListNextPageTokens",
      outlookMetadata: "email, historyId, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
      contacts:
        "[email+contactEmailAddress], contactName, isSavedContact, lastInteraction",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 4");
      return;
    },
  },

  /*
  Schema Version 5:
  Oldest Compatible App Version 0.0.11
  Change description:
    - Add InboxZeroMetadata table
  */
  5: {
    schema: {
      emails: "email, provider, accessToken, expiresAt",
      selectedEmail: "id, email, provider",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments",
      googleMetadata: "email, historyId, *threadsListNextPageTokens",
      outlookMetadata: "email, historyId, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
      contacts:
        "[email+contactEmailAddress], contactName, isSavedContact, lastInteraction",
      inboxZeroMetadata: "email, inboxZeroStartDate",
      dailyImageMetadata: "id, date, url",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 5");

      // clear database since we are introducing inbox zero
      cleanIndexedDb();
    },
  },

  /*
  Schema Version 6:
  Oldest Compatible App Version 0.0.14
  Change description:
    - Add search history table
    - Script to decode google message data for search performance
    - Move inboxZeroStartDate to selectedEmail table
  */
  6: {
    schema: {
      emails: "email, provider, accessToken, expiresAt, inboxZeroStartDate",
      selectedEmail: "id, email, provider, inboxZeroStartDate",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments",
      googleMetadata: "email, historyId, *threadsListNextPageTokens",
      outlookMetadata: "email, historyId, *threadsListNextPageTokens",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
      contacts:
        "[email+contactEmailAddress], contactName, isSavedContact, lastInteraction",
      dailyImageMetadata: "id, date, url",
      searchHistory: "[email+searchQuery]",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 6");

      // Used to distinguish between google and outlook messages
      const isHex = (str: string) => {
        return /^[0-9A-Fa-f]*$/.test(str);
      };

      // decode google message data
      return tx
        .table("messages")
        .toCollection()
        .modify((message) => {
          if (message.threadId && isHex(message.threadId)) {
            try {
              if (message.htmlData) {
                message.htmlData = decodeGoogleMessageData(message.htmlData);
              }

              if (message.textData) {
                message.textData = decodeGoogleMessageData(message.textData);
              }
            } catch (e) {
              dLog("Error decoding google message data", e);
            }
          }
        });
    },
  },

  /*
  Schema Version 7:
  Oldest Compatible App Version 0.0.15
  Change description:
    - Remove all metadata tables
  */
  7: {
    schema: {
      emails: "email, provider, accessToken, expiresAt, inboxZeroStartDate",
      selectedEmail: "id, email, provider, inboxZeroStartDate",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
      contacts:
        "[email+contactEmailAddress], contactName, isSavedContact, lastInteraction",
      dailyImageMetadata: "id, date, url",
      searchHistory: "[email+searchQuery]",
      cachedSummaryCardData: "threadId, threadSummary",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 7");

      // nuke db once again
      cleanIndexedDb();
    },
  },

  /*
  Schema Version 8:
  Oldest Compatible App Version 0.0.16
  Change description:
    - Add drafts table
    - Add action items table
    - Update emailThreads with action item info
  */
  8: {
    schema: {
      emails: "email, provider, accessToken, expiresAt, inboxZeroStartDate",
      selectedEmail: "id, email, provider, inboxZeroStartDate",
      emailThreads:
        "id, historyId, email, from, subject, snippet, date, unread, *labelIds, hasAttachments, actionItemGenerated, actionItemString",
      messages:
        "id, threadId, *labelIds, from, *toRecipients, snippet, headers, textData, htmlData, date, *attachments",
      outlookFolders: "id, displayName",
      contacts:
        "[email+contactEmailAddress], contactName, isSavedContact, lastInteraction",
      dailyImageMetadata: "id, date, url",
      searchHistory: "[email+searchQuery]",
      cachedSummaryCardData: "threadId, threadSummary",
      drafts:
        "id, email, provider, to, cc, bcc, subject, html, threadId, replyType, inReplyTo",
      actionItems: "threadId, email, actionItemString, completed",
    },
    upgradeFnc: async (tx: Transaction) => {
      dLog("Upgrading schema to version 7");

      // nuke db once again
      cleanIndexedDb();
    },
  },
};
