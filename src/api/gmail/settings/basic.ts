import { GmailAutoForwardingDataType } from "../../model/settings.basic";
import { GMAIL_API_URL } from "../constants";

export const getAutoForwarding = async (accessToken: string) => {
  let data: GmailAutoForwardingDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/settings/autoForwarding`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching auto forwarding";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching auto forwarding";
  }

  return { data, error };
};

// no sufficient scopes yet
export const updateAutoForwarding = async (
  accessToken: string,
  enabled: boolean,
  emailAddress: string,
  disposition: string
) => {
  let data: GmailAutoForwardingDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/settings/autoForwarding`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled, emailAddress, disposition }),
      }
    );

    if (!res.ok) {
      error = "Error updating auto forwarding";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error updating auto forwarding";
  }

  return { data, error };
};
