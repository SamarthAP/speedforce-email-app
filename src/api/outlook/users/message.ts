import { OUTLOOK_API_URL } from "../constants";
import { OutlookMessageDataType } from "../../model/users.thread";

export const get = async (accessToken: string, messageId: string, fieldSet: string[]) => {

  const fields = fieldSet.join(",").trim();
  const response = await fetch(
    `${OUTLOOK_API_URL}/messages/${messageId}?$select=${fields}'`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw Error("Error fetching thread");
  }

  const data: OutlookMessageDataType = await response.json();
  return data;
};