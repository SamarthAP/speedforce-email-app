import { dLog } from "../../../lib/noProd";
import { OutlookAttachmentDataType } from "../../model/users.attachment";
import { OUTLOOK_API_URL } from "../constants";

export const list = async (accessToken: string, messageId: string) => {
  let data: OutlookAttachmentDataType[] | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${OUTLOOK_API_URL}/messages/${messageId}/attachments`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching attachments";
    } else {
      const resData = await res.json();
      data = resData.value;
    }
  } catch (e) {
    dLog(e);
    error = "Error fetching attachments";
  }

  return { data, error };
};

export const get = async (
  accessToken: string,
  messageId: string,
  attachmentId: string
) => {
  let data: OutlookAttachmentDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${OUTLOOK_API_URL}/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching attachment";
    } else {
      data = await res.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error fetching attachment";
  }

  return { data, error };
};
