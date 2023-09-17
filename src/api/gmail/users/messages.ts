import { GMAIL_API_URL } from "../constants";

interface GoogleGetAttachmentResponse {
  size: number;
  data: string;
}

export const getAttachment = async (
  accessToken: string,
  messageId: string,
  attachmentId: string
) => {
  let data: GoogleGetAttachmentResponse | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${GMAIL_API_URL}/messages/${messageId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      error = "Error fetching attachment";
    } else {
      data = await response.json();
    }
  } catch (e) {
    error = "Error fetching attachment";
  }

  return { data, error };
};
