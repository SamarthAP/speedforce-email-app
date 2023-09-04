import { db } from "./db";

export async function getGoogleMetaData(
  email: string,
  folderId: string
) {
  const metaData = await db.googleMetadata
    .where("email")
    .equals(email)
    .first();
  
  return metaData?.threadsListNextPageTokens.find(obj => obj.folderId === folderId);
}

export async function getOutlookMetaData(
  email: string,
  folderId: string
) {
  const metaData = await db.outlookMetadata
    .where("email")
    .equals(email)
    .first();

  return metaData?.threadsListNextPageTokens.find(obj => obj.folderId === folderId);
}

export async function setPageToken(
  email: string, 
  provider: "google" | "outlook",
  folderId: string, 
  nextPageToken: string,
  maxHistoryId = 0
) {
  if (provider === "google") {
    await db.googleMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        const i = row.threadsListNextPageTokens.findIndex(obj => obj.folderId === folderId);
        if(i == -1) {
          row.threadsListNextPageTokens.push({ folderId, historyId: maxHistoryId.toString(), token: nextPageToken });
        } else {
          row.threadsListNextPageTokens[i].token = nextPageToken;
        }
      });

  } else if (provider === "outlook") {
    db.outlookMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        const i = row.threadsListNextPageTokens.findIndex(obj => obj.folderId === folderId);
        if(i == -1) {
          row.threadsListNextPageTokens.push({ folderId, token: nextPageToken });
        } else {
          row.threadsListNextPageTokens[i].token = nextPageToken;
        }
      });
  }
}

export async function setHistoryId(
  email: string,
  provider: "google" | "outlook",
  folderId: string,
  maxHistoryId: number
) {
  if (provider === "google") {
    await db.googleMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        const i = row.threadsListNextPageTokens.findIndex(obj => obj.folderId === folderId);
        if(i != -1) {
          let historyId = row.threadsListNextPageTokens[i].historyId;
          if(parseInt(historyId) < maxHistoryId) {
            row.threadsListNextPageTokens[i].historyId = maxHistoryId.toString();
          }
        }
      });
  } else if (provider === "outlook") {
    // TODO: implement
  }
}