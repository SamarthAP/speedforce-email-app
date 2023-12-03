import { OutlookContactListDataType } from "../../model/people.contacts";
import { OUTLOOK_API_URL } from "../constants";

export const list = async (accessToken: string) => {
  let data: OutlookContactListDataType[] | null = null;
  let error: string | null = null;

  const res = await fetch(
    `${OUTLOOK_API_URL}/me/contacts?$select=id,givenName,surname,displayName,emailAddresses`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    error = "Error fetching threads";
  } else {
    const resData = await res.json();
    data = resData.value;
  }

  return { data, error };
};
