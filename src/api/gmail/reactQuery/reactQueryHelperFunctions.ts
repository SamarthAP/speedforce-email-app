import { GoogleThreadsListDataType } from "../../model/users.thread";
import { GMAIL_API_URL } from "../constants";

// // Note: must have query param. we don't have an "all mail" folder. queryParam is a string like "labelIds=STARRED"
export const list = async (
  accessToken: string,
  gmailQueryParam: string,
  pageToken?: string
) => {
  // TODO: check if query param or just regular param for each page lol
  let url = `${GMAIL_API_URL}/threads?maxResults=20&${gmailQueryParam}`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const res: Response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw Error("Error fetching gmail threads");
  }

  return res.json() as Promise<GoogleThreadsListDataType>;
};
