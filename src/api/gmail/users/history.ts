import { GMAIL_API_URL } from "../constants";
import { HistoryListDataType } from "../../model/users.history";

export const list = async (accessToken: string, startHistoryId: string) => {
  let data: HistoryListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/history?startHistoryId=${startHistoryId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        error = "No history found, need to sync from scratch";
      } else {
        error = "Error fetching history";
      }
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching history";
  }

  return { data, error };
};
