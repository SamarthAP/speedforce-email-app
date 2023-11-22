import { GMAIL_PEOPLE_API_URL } from "../constants";
import { GmailContactListDataType } from "../../model/people.contacts";

export const list = async (accessToken: string) => {
  let data: GmailContactListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_PEOPLE_API_URL}/connections?personFields=names,emailAddresses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching contacts";
  }

  return { data, error };
};
