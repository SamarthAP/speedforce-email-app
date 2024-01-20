import { OutlookThreadsListDataType } from "../../model/users.thread";
import { OUTLOOK_API_URL } from "../constants";

export const list = async (
  accessToken: string,
  outlookQueryParams: string,
  pageToken?: string
) => {
  let data: OutlookThreadsListDataType | null = null; // TODO: fix data type
  let error: string | null = null;

  try {
    const url = pageToken || `${OUTLOOK_API_URL}/me/${outlookQueryParams}`;
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      // TODO: throw error
      error = "Error fetching threads";
    } else {
      const resData = await res.json();
      console.log("ResData: ", resData);
      data = {
        nextPageToken: resData["@odata.nextLink"],
        value: resData.value,
      };
    }
  } catch (e) {
    error = "Error fetching threads";
  }

  // TODO: should ideally return res.json() as Promise<OutlookThreadsListDataType>; (with the correct data type posted on discord)
  return { data, error };
};
