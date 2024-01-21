import { OutlookThreadsListDataType } from "../../model/users.thread";
import { OUTLOOK_API_URL } from "../constants";

export const list = async (
  accessToken: string,
  outlookQueryParams: string,
  pageToken?: string
) => {
  try {
    const url = pageToken || `${OUTLOOK_API_URL}/me/${outlookQueryParams}`;
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw Error("Error fetching outlook threads");
    } else {
      const resData = await res.json();
      return {
        nextPageToken: resData["@odata.nextLink"],
        value: resData.value,
      } as OutlookThreadsListDataType;
    }
  } catch (e) {
    throw Error("Error fetching outlook threads");
  }
};
