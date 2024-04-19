// Helper functions for Outlook to follow Gmail nomenclature
import { OutlookMessageDataType } from "../model/users.message";
import { db } from "../../lib/db";
import { get } from "./users/folder";
import { getAccessToken } from "../accessToken";
import { dLog } from "../../lib/noProd";

// Build headers for outlook messages for send functionality
export function buildMessageHeadersOutlook(message: OutlookMessageDataType) {
  // TODO: Add the rest of the headers later as needed
  return [
    {
      name: "From",
      value: message.from?.emailAddress?.address || "",
    },
    {
      name: "To",
      value: message.toRecipients[0]?.emailAddress.address || "",
    },
    {
      name: "Subject",
      value: message.subject,
    },
  ];
}

export function buildMessageLabelIdsOutlook(message: OutlookMessageDataType) {
  const labelIds = [];

  if (!message.isRead) {
    labelIds.push("UNREAD");
  }

  if (message.flag && message.flag.flagStatus === "flagged") {
    labelIds.push("STARRED");
  }

  return labelIds;
}

// Remove folders from labelIds, but allow for a list of labels to be preserved (e.g. UNREAD)
// export function getLabelIdsForMoveMessageOutlook(
//   labelIds: string[],
//   folderId: string,
//   allowList: string[] = []
// ) {
//   const filteredLabelIds = labelIds.filter((labelId) => {
//     return allowList?.includes(labelId);
//   });

//   filteredLabelIds.push(folderId);

//   return filteredLabelIds;
// }

export function addLabelIdsOutlook(labelIds: string[], label: string) {
  return labelIds.concat(label);
}

export function removeLabelIdsOutlook(labelIds: string[], label: string) {
  return labelIds.filter((labelId) => labelId !== label);
}

export function formatFolderDisplayNameOutlook(folderName: string) {
  return folderName.replace(/\s+/g, "");
}

export async function getFolderNameFromIdOutlook(
  email: string,
  folderId: string
) {
  const folderName = await db.outlookFolders.get(folderId);
  if (folderName) return folderName.displayName;

  const accessToken = await getAccessToken(email);
  const { data, error } = await get(accessToken, folderId);

  if (!data || error) {
    dLog("Error fetching folder name");
    return "";
  }

  const formattedDisplayName = formatFolderDisplayNameOutlook(data.displayName);
  await db.outlookFolders.put({
    id: folderId,
    displayName: formattedDisplayName,
  });

  return formattedDisplayName;
}

// Tokens are of the form "https://graph.microsoft.com/v1.0/me/mailFolders('Inbox')/messages?%24select=id%2cconversationId&%24top=20&%24skip=20"
// query param top is the number of messages to query
// query param skip is the number of messages to skip
export function isOutlookNextPageTokenNewer(
  oldToken: string,
  newToken: string
) {
  const oldTokenSkip = /%24skip=(\d+)/.exec(oldToken);
  const newTokenSkip = /%24skip=(\d+)/.exec(newToken);

  if (!newTokenSkip) {
    return false;
  }

  if (!oldTokenSkip) {
    return true;
  }

  return parseInt(newTokenSkip[1]) > parseInt(oldTokenSkip[1]);
}

export function getOutlookHistoryIdFromDateTime(dateTime: string) {
  return new Date(dateTime).getTime() / 1000;
}

export function getOutlookSubscriptionExpirationDateTime() {
  const expirationDateTime = new Date();
  expirationDateTime.setUTCDate(expirationDateTime.getUTCDate() + 3);
  return expirationDateTime.toISOString();
}

export const getProfilePictureOutlook = async (accessToken: string) => {
  let data: any;
  let error: string | null = null;
  try {
    const res: Response = await fetch(
      `https://graph.microsoft.com/v1.0/me/photo/$value`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      const blob = await res.blob();
      const reader = new FileReader();
      data = await new Promise<string | ArrayBuffer | null>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    error = "Error getting profile picture";
  }
  return { data, error };
};
