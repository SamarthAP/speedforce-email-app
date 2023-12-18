import { OUTLOOK_API_URL } from "../constants";
import { OutlookMailFolderType } from "../../model/users.folder";

export const get = async (accessToken: string, folderId: string) => {
  let data: OutlookMailFolderType | null = null;
  let error: string | null = null;

  const res = await fetch(`${OUTLOOK_API_URL}/me/mailFolders/${folderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  if (!res.ok) {
    error = "Error fetching threads";
  } else {
    data = await res.json();
  }

  return { data, error };
};
