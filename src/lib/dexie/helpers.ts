import { db } from "../db";
import { isOutlookNextPageTokenNewer } from "../../api/outlook/helpers";
import { dLog } from "../noProd";

export async function getGoogleMetaData(email: string, folderId: string) {
  const metaData = await db.googleMetadata.where("email").equals(email).first();

  return metaData?.threadsListNextPageTokens.find(
    (obj) => obj.folderId === folderId
  );
}

export async function getOutlookMetaData(email: string, folderId: string) {
  const metaData = await db.outlookMetadata
    .where("email")
    .equals(email)
    .first();

  return metaData?.threadsListNextPageTokens.find(
    (obj) => obj.folderId === folderId
  );
}

export async function setPageToken(
  email: string,
  provider: "google" | "outlook",
  folderId: string,
  nextPageToken: string
) {
  if (provider === "google") {
    await db.googleMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        const i = row.threadsListNextPageTokens.findIndex(
          (obj) => obj.folderId === folderId
        );
        if (i == -1) {
          row.threadsListNextPageTokens.push({
            folderId,
            token: nextPageToken,
          });
        } else {
          row.threadsListNextPageTokens[i].token = nextPageToken;
        }
      });
  } else if (provider === "outlook") {
    await db.outlookMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        const i = row.threadsListNextPageTokens.findIndex(
          (obj) => obj.folderId === folderId
        );
        if (i == -1) {
          row.threadsListNextPageTokens.push({
            folderId,
            token: nextPageToken,
          });
        } else if (
          isOutlookNextPageTokenNewer(
            row.threadsListNextPageTokens[i].token,
            nextPageToken
          )
        ) {
          row.threadsListNextPageTokens[i].token = nextPageToken;
        }
      });
  }
}

export async function setHistoryId(
  email: string,
  provider: "google" | "outlook",
  maxHistoryId: number
) {
  if (provider === "google") {
    await db.googleMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        if (maxHistoryId > parseInt(row.historyId)) {
          row.historyId = maxHistoryId.toString();
        }
      });
  } else if (provider === "outlook") {
    await db.outlookMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        if (maxHistoryId > parseInt(row.historyId)) {
          row.historyId = maxHistoryId.toString();
        }
      });
  }
}

export const clearEmailFromDb = async (email: string) => {
  try {
    const emails = (await db.emails.toArray()).filter((e) => e.email !== email);

    if (emails.length === 0) {
      // Clear db if this is the only remaining email
      db.tables.forEach((table) => void table.clear());
    } else {
      const selectedEmail = await db.selectedEmail.get(1);
      const emailThreads = (
        await db.emailThreads.where("email").equals(email).toArray()
      ).map((t) => t.id);

      void db.emails.where("email").equals(email).delete();
      void db.emailThreads.where("id").anyOf(emailThreads).delete();
      void db.messages.where("threadId").anyOf(emailThreads).delete();
      void db.googleMetadata.where("email").equals(email).delete();
      void db.outlookMetadata.where("email").equals(email).delete();

      // If the selected email is being deleted, select the first remaining email
      if (selectedEmail?.email === email) {
        void db.selectedEmail.put({
          id: 1,
          email: emails[0].email,
          provider: emails[0].provider,
        });
      }
    }
  } catch (e) {
    dLog(e);
    return e;
  }

  return null;
};
