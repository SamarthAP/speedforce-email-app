import { OUTLOOK_API_URL } from "../constants";
import { OutlookMessageDataType } from "../../model/users.message";
import { NewAttachment } from "../../../components/WriteMessage";

export const get = async (
  accessToken: string,
  messageId: string,
  fieldSet: string[]
) => {
  const fields = fieldSet.join(",").trim();
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}?$select=${fields}'`,
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

export const sendEmail = async (
  accessToken: string,
  to: string,
  subject: string,
  messageContent: string
) => {
  const response = await fetch(`${OUTLOOK_API_URL}/me/sendmail`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: subject,
        body: {
          contentType: "html",
          content: messageContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
    }),
  });

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    throw Error("Error replying to thread");
  }
};

export const sendEmailWithAttachments = async (
  accessToken: string,
  to: string,
  subject: string,
  messageContent: string,
  attachments: NewAttachment[]
) => {
  const response = await fetch(`${OUTLOOK_API_URL}/me/sendmail`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: subject,
        body: {
          contentType: "html",
          content: messageContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        attachments: attachments.map((attachment) => {
          return {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: attachment.filename,
            contentType: attachment.mimeType,
            contentBytes: attachment.data,
            size: attachment.size,
          };
        }),
      },
    }),
  });

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    throw Error("Error replying to thread");
  }
};

export const sendReply = async (
  accessToken: string,
  subject: string,
  messageId: string,
  messageContent: string
) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}/reply`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: `Re: ${subject}`,
          body: {
            contentType: "html",
            content: messageContent,
          },
        },
      }),
    }
  );

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    throw Error("Error replying to thread");
  }
};

export const sendReplyAll = async (
  accessToken: string,
  subject: string,
  messageId: string,
  messageContent: string
) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}/replyAll`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: `Re: ${subject}`,
          body: {
            contentType: "html",
            content: messageContent,
          },
        },
      }),
    }
  );

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    throw Error("Error replying to thread");
  }
};
