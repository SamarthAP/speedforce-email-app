import { db } from "../db";
import { isOutlookNextPageTokenNewer } from "../../api/outlook/helpers";

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
