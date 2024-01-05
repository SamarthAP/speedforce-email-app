import {
  GmailForwardingAddressDataType,
  GmailListForwardingAddressesDataType,
} from "../../model/settings.forwardingAddresses";
import { GMAIL_API_URL } from "../constants";

export const listForwardingAddresses = async (accessToken: string) => {
  let data: GmailListForwardingAddressesDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/settings/forwardingAddresses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching forwarding addresses";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching forwarding addresses";
  }

  return { data, error };
};

// no sufficient scopes yet
export const createForwardingAddress = async (
  accessToken: string,
  forwardingEmail: string
) => {
  let data: GmailForwardingAddressDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/settings/forwardingAddresses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forwardingEmail }),
      }
    );

    if (!res.ok) {
      error = "Error creating forwarding address";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error creating forwarding address";
  }

  return { data, error };
};
