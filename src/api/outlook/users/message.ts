import { OUTLOOK_API_URL } from "../constants";
import { OutlookMessageDataType } from "../../model/users.message";
import { NewAttachment } from "../../model/users.attachment";
import { delay } from "../../../lib/util";

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
  toRecipients: string[],
  ccRecipients: string[],
  bccRecipients: string[],
  subject: string,
  messageContent: string
) => {
  let data: any | null = null;
  let error: string | null = null;

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
        toRecipients: toRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
        ccRecipients: ccRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
        bccRecipients: bccRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
      },
    }),
  });

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    error = "Error sending email";
  } else {
    // wait for message to send before fetching most recent
    await delay(1000);

    // Get the details of the sent message
    const messageResponse = await fetch(
      `${OUTLOOK_API_URL}/me/mailfolders/sentitems/messages?$orderby=createdDateTime desc&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      error = "Error fetching sent message";
    } else {
      const messageData = await messageResponse.json();
      data = { messageId: messageData.value[0].id };
    }
  }
  return { data, error };
};

export const sendEmailWithAttachments = async (
  accessToken: string,
  toRecipients: string[],
  ccRecipients: string[],
  bccRecipients: string[],
  subject: string,
  messageContent: string,
  attachments: NewAttachment[]
) => {
  let data: any | null = null;
  let error: string | null = null;
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
        toRecipients: toRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
        ccRecipients: ccRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
        bccRecipients: bccRecipients.map((email) => ({
          emailAddress: { address: email.trim() },
        })),
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
    error = "Error sending email";
  } else {
    // Get the details of the sent message
    const messageResponse = await fetch(
      `${OUTLOOK_API_URL}/me/mailfolders/sentitems/messages?$orderby=createdDateTime desc&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      error = "Error fetching sent message";
    } else {
      const messageData = await messageResponse.json();
      data = { messageId: messageData.value[0].id };
    }
  }
  return { data, error };
};

export const sendReply = async (
  accessToken: string,
  subject: string,
  messageId: string,
  messageContent: string
) => {
  let error: string | null = null;
  let data: any | null;
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
    error = "Error replying to thread";
  } else {
    const messageResponse = await fetch(
      `${OUTLOOK_API_URL}/me/mailfolders/sentitems/messages?$orderby=createdDateTime desc&$top=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      error = "Error fetching sent message";
    } else {
      const messageData = await messageResponse.json();
      data = { messageId: messageData.value[0].id };
    }
  }
  return { data, error };
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
