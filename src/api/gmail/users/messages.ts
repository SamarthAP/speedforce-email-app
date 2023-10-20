import { unescape } from "lodash";
import { dLog } from "../../../lib/noProd";
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

export const sendEmail = async (
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  messageContent: string
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null = null;

  try {
    const encodedReply = btoa(
      'Content-Type: text/html; charset="UTF-8"\n' +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n" +
        `Subject: ${subject}\n` +
        `From: ${from}\n` +
        `To: ${to}\n\n` +
        messageContent
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch(`${GMAIL_API_URL}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        raw: encodedReply,
      }),
    });
    if (!response.ok) {
      error = "Error sending email";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error sending email";
  }

  return { data, error };
};

export const sendEmailWithAttachments = async (
  accesToken: string,
  from: string,
  to: string,
  subject: string,
  messageContent: string,
  attachments: any[]
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null = null;

  try {
    // A multipart/mixed MIME message is composed of a mix of
    // different data types. Each body part is delineated by a boundary.
    // The boundary parameter is a text string used to delineate one part
    // of the message body from another.
    // https://learn.microsoft.com/en-us/exchange/troubleshoot/administration/multipart-mixed-mime-message-format
    const encodedReply = btoa(
      'Content-Type: multipart/mixed; boundary="spdfrce"\n' +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n" +
        `Subject: ${subject}\n` +
        `From: ${from}\n` +
        `To: ${to}\n\n` +
        `--spdfrce\n` +
        `Content-Type: text/html; charset="UTF-8"\n` +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n\n" +
        messageContent +
        "\n\n" +
        attachments
          .map(
            (attachment) =>
              `--spdfrce\n` +
              `Content-Type: ${attachment.mimeType}\n` +
              `MIME-Version: 1.0\n` +
              `Content-Transfer-Encoding: base64\n` +
              `Content-Disposition: attachment; filename="${attachment.filename}"\n\n` +
              attachment.data // data is base64 encoded
          )
          .join("\n") +
        "\n\n" +
        "--spdfrce--"
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch(
      `${GMAIL_API_URL}/messages/send?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "message/rfc822",
          Authorization: `Bearer ${accesToken}`,
        },
        body: JSON.stringify({
          raw: encodedReply,
        }),
      }
    );
    dLog(response);
    if (!response.ok) {
      error = "Error sending email";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error sending email";
  }

  return { data, error };
};

export const forward = async (
  accessToken: string,
  from: string,
  to: string[],
  subject: string,
  messageContent: string
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null = null;

  try {
    const encodedReply = btoa(
      'Content-Type: text/html; charset="UTF-8"\n' +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n" +
        `Subject: Fwd: ${subject}\n` +
        `From: ${from}\n` +
        `To: ${to}\n\n` +
        messageContent
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch(`${GMAIL_API_URL}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        raw: encodedReply,
      }),
    });
    if (!response.ok) {
      error = "Error sending reply";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error sending reply";
  }

  return { data, error };
};
