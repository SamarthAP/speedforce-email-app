import {
  deleteThread as gDeleteThread,
  get as gThreadGet,
  // list as gThreadList,
  // listNextPage as gThreadListNextPage,
  removeLabelIds,
  sendReply as gSendReply,
  trashThread as gTrashThread,
  addLabelIds,
} from "../api/gmail/users/threads";
import {
  sendEmail as gSendEmail,
  sendEmailWithAttachments as gSendEmailWithAttachments,
  forward as gForward,
  getAttachment as gAttachmentGet,
} from "../api/gmail/users/messages";
// import { list as gHistoryList } from "../api/gmail/users/history";
import {
  list as gContactList,
  listDirectoryPeople,
  listOtherContacts,
} from "../api/gmail/people/contact";
import { watch as watchGmail } from "../api/gmail/notifications/pushNotifications";
import { getToRecipients, buildForwardedHTML } from "../api/gmail/helpers";

import {
  get as mThreadGet,
  // list as mThreadList,
  // listNextPage as mThreadListNextPage,
  markRead as mThreadMarkRead,
  forward as mForward,
  deleteMessage as mDeleteMessage,
  moveMessage as mMoveMessage,
  starMessage as mStarMessage,
} from "../api/outlook/users/threads";
import { list as mThreadList } from "../api/outlook/reactQuery/reactQueryHelperFunctions";
import {
  sendEmail as mSendEmail,
  sendEmailWithAttachments as mSendEmailWithAttachments,
  sendReply as mSendReply,
  sendReplyAll as mSendReplyAll,
} from "../api/outlook/users/message";
import {
  // list as mAttachmentList,
  get as mAttachmentGet,
} from "../api/outlook/users/attachment";
import { list as mContactsList } from "../api/outlook/people/contacts";
import {
  list as mSubscriptionsList,
  create as mSubscriptionsCreate,
  updateExpirationDateTime as mSubscriptionsUpdateExpirationDateTime,
} from "../api/outlook/notifcations/subscriptions";
import {
  buildMessageHeadersOutlook,
  buildMessageLabelIdsOutlook,
  addLabelIdsOutlook,
  removeLabelIdsOutlook,
  getFolderNameFromIdOutlook,
  // getOutlookHistoryIdFromDateTime,
  getOutlookSubscriptionExpirationDateTime,
} from "../api/outlook/helpers";
import {
  create as gDraftCreate,
  update as gDraftUpdate,
  deleteDraft as gDraftDelete,
} from "../api/gmail/users/drafts";
import {
  create as mDraftCreate,
  update as mDraftUpdate,
  send as mDraftSend,
} from "../api/outlook/users/drafts";
import { getAccessToken } from "../api/accessToken";
import { IAttachment, IContact, IEmailThread, IMessage, db } from "./db";
import {
  buildSearchQuery,
  decodeGoogleMessageData,
  getMessageHeader,
  saveSearchQuery,
  upsertLabelIds,
} from "./util";
import _ from "lodash";
import { dLog } from "./noProd";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { NewAttachment } from "../api/model/users.attachment";
import toast from "react-hot-toast";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import { CreateDraftResponseDataType } from "../api/model/users.draft";

export async function handleNewThreadsGoogle(
  accessToken: string,
  email: string,
  threadIds: string[]
) {
  let maxHistoryId = 0;

  const promises = threadIds.map((threadId) =>
    gThreadGet(accessToken, threadId)
  );

  try {
    const threads = await Promise.all(promises);
    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];

    threads.forEach((thread) => {
      // let hasInboxLabel = false;
      let isStarred = false;
      let labelIds: string[] = [];
      for (const message of thread.messages) {
        // if (message.labelIds?.includes("INBOX")) {
        //   hasInboxLabel = true;
        // }
        if (message.labelIds?.includes("STARRED")) {
          isStarred = true;
        }
      }

      if (isStarred) labelIds = upsertLabelIds(labelIds, "STARRED");

      // if folderId is DONE and thread includes INBOX labelId, skip
      // if (filter.folderId === FOLDER_IDS.DONE && hasInboxLabel) {
      //   return;
      // }
      // thread history id i think will be max of all messages' history ids
      if (parseInt(thread.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(thread.historyId);
      }

      let hasAttachments = false;
      thread.messages.forEach((message) => {
        // multipart/alternative is text and html, multipart/mixed is attachment
        // const textData =
        //   message.payload.mimeType === "multipart/alternative"
        //     ? message.payload.parts[0].body.data || ""
        //     : message.payload.parts[0].parts[0].body?.data || "";
        // const htmlData =
        //   message.payload.mimeType === "multipart/alternative"
        //     ? message.payload.parts[1].body.data || ""
        //     : message.payload.parts[0].parts[1].body?.data || "";

        let textData = "";
        let htmlData = "";
        const attachments: IAttachment[] = [];

        message.payload.parts?.forEach((part) => {
          if (part.mimeType === "text/plain") {
            textData = part.body.data || "";
          } else if (part.mimeType === "text/html") {
            htmlData = part.body.data || "";
          }

          if (part.parts) {
            part.parts.forEach((nestedPart) => {
              if (nestedPart.mimeType === "text/plain") {
                textData = nestedPart.body.data || "";
              } else if (nestedPart.mimeType === "text/html") {
                htmlData = nestedPart.body.data || "";
              }
            });
          }

          if (part.filename && part.filename !== "") {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              attachmentId: part.body.attachmentId || "",
              size: part.body.size || 0,
            });
            hasAttachments = true;
          }
        });

        if (htmlData === "") {
          htmlData = message.payload.body.data || "";
        }

        parsedMessages.push({
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          from: getMessageHeader(message.payload.headers, "From"),
          toRecipients: getMessageHeader(message.payload.headers, "To")
            .split(",")
            .map((recipient) => recipient.trim()),
          snippet: message.snippet || "",
          headers: message.payload.headers,
          textData: decodeGoogleMessageData(textData),
          htmlData: decodeGoogleMessageData(htmlData),
          date: parseInt(message.internalDate),
          attachments,
        });

        message.labelIds.forEach((id) => {
          const labelId = GMAIL_FOLDER_IDS_MAP.getKey(id) || id;
          labelIds = upsertLabelIds(labelIds, labelId);
        });
      });

      const lastMessageIndex = thread.messages.length - 1;
      parsedThreads.push({
        id: thread.id,
        historyId: thread.historyId,
        email: email,
        from: getMessageHeader(thread.messages[0].payload.headers, "From"),
        subject: getMessageHeader(
          thread.messages[0].payload.headers,
          "Subject"
        ),
        snippet: thread.messages[lastMessageIndex].snippet || "", // this should be the latest message's snippet
        date: parseInt(thread.messages[lastMessageIndex].internalDate),
        unread: thread.messages[lastMessageIndex].labelIds?.includes("UNREAD"),
        labelIds: labelIds,
        hasAttachments,
      });
    });

    // save threads
    await db.emailThreads.bulkPut(parsedThreads);
    await db.messages.bulkPut(parsedMessages);

    return;
  } catch (e) {
    dLog("Could not sync mailbox");
    dLog(e);
    return;
  }
}

async function batchGetThreads(
  accessToken: string,
  threadIds: string[],
  batchSize = 3
) {
  const threads = [];
  const batches = _.chunk(threadIds, batchSize);
  for (const batch of batches) {
    const promises = [];
    for (const threadId of batch) {
      promises.push(mThreadGet(accessToken, threadId));
    }

    try {
      const batchThreads = await Promise.all(promises);
      threads.push(...batchThreads);
    } catch (e) {
      dLog("Error getting batch threads");
      continue;
    }
  }

  return threads;
}

export async function handleNewThreadsOutlook(
  accessToken: string,
  email: string,
  threadsIds: string[],
  additionalLabelIds: string[] = [] // Label ids that should be appended to all threads (e.g. SENT)
) {
  try {
    // Outlook throttle limit is 4 concurrent requests
    const threads = await batchGetThreads(accessToken, threadsIds, 3);

    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];
    for (const thread of threads) {
      let unread = false;
      let isStarred = false;
      let isImportant = false;
      let hasAttachments = false;
      let labelIds: string[] = [];
      for (const message of thread.value) {
        if (!message.isRead) {
          unread = true;
        }
        if (message.flag && message.flag.flagStatus === "flagged") {
          isStarred = true;
        }
        if (message.inferenceClassification.toLowerCase() === "focused") {
          isImportant = true;
        }
        if (message.hasAttachments) {
          hasAttachments = true;
        }
      }

      if (isStarred) labelIds = upsertLabelIds(labelIds, "STARRED");
      if (unread) labelIds = upsertLabelIds(labelIds, "UNREAD");
      if (isImportant) labelIds = upsertLabelIds(labelIds, "IMPORTANT");

      for (const message of thread.value) {
        let textData = "";
        let htmlData = "";

        if (message.body.contentType === "plain") {
          textData = message.body.content || "";
        } else if (message.body.contentType === "html") {
          htmlData = message.body.content || "";
        }

        const attachments: IAttachment[] =
          message.attachments?.map((attachment) => {
            return {
              filename: attachment.name,
              mimeType: attachment.contentType,
              attachmentId: attachment.id,
              size: attachment.size,
            };
          }) || [];
        // // List attachments
        // if (message.hasAttachments) {
        //   const { data, error } = await mAttachmentList(
        //     accessToken,
        //     message.id
        //   );

        //   if (data && !error) {
        //     // attachments.data.value.forEach((attachment) => {
        //     attachments = data.map((attachment) => {
        //       return {
        //         filename: attachment.name,
        //         mimeType: attachment.contentType,
        //         attachmentId: attachment.id,
        //         size: attachment.size,
        //       };
        //     });
        //   } else {
        //     dLog("Error getting attachments");
        //   }
        // }

        // TODO: Add CC, BCC, attachments, etc.
        parsedMessages.push({
          id: message.id,
          threadId: message.conversationId,
          labelIds:
            buildMessageLabelIdsOutlook(message).concat(additionalLabelIds),
          from:
            message.from?.emailAddress?.address ||
            message.sender?.emailAddress?.address ||
            "No Sender",
          toRecipients: message.toRecipients.map((m) => m.emailAddress.address), // TODO: add multiple recipients
          snippet: message.bodyPreview || "",
          headers: buildMessageHeadersOutlook(message),
          textData,
          htmlData,
          date: new Date(message.receivedDateTime).getTime(),
          attachments: attachments, // TODO: implement for outlook
        });

        // dLog(message)
        const folderName = await getFolderNameFromIdOutlook(
          email,
          message.parentFolderId
        );
        const labelId = OUTLOOK_FOLDER_IDS_MAP.getKey(folderName) || folderName;
        labelIds = upsertLabelIds(labelIds, labelId);
      }

      const lastMessageIndex = thread.value.length - 1;
      parsedThreads.push({
        id: thread.value[lastMessageIndex].conversationId,
        historyId: "",
        email: email,
        from:
          thread.value[lastMessageIndex].from?.emailAddress?.address ||
          thread.value[lastMessageIndex].sender?.emailAddress?.address ||
          "No Sender",
        subject: thread.value[lastMessageIndex].subject,
        snippet: thread.value[lastMessageIndex].bodyPreview,
        date: new Date(
          thread.value[lastMessageIndex].receivedDateTime
        ).getTime(),
        unread: unread,
        labelIds: labelIds,
        hasAttachments: hasAttachments,
      });
    }

    await db.emailThreads.bulkPut(parsedThreads);
    await db.messages.bulkPut(parsedMessages);
    return parsedThreads;
  } catch (e) {
    dLog("Could not sync mailbox");
    dLog(e);
    return [];
  }
}

export async function markRead(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await removeLabelIds(accessToken, threadId, [
      "UNREAD",
    ]);

    if (error || !data) {
      dLog("Error marking thread as read");
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await db.emailThreads.update(threadId, { unread: false });
    }
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const apiPromises = messages.map((message) => {
      return mThreadMarkRead(accessToken, message.id);
    });

    const updateDexiePromises = messages.map((message) => {
      return db.messages.update(message.id, {
        labelIds: removeLabelIdsOutlook(message.labelIds, "UNREAD"),
      });
    });

    // mark all messages in conversation as read since isRead is tied to the message, not the thread
    // TODO: error handling
    await Promise.all(apiPromises);
    await Promise.all(updateDexiePromises);
    await db.emailThreads.update(threadId, { unread: false });
  }
}

export async function starThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await addLabelIds(accessToken, threadId, [
      "STARRED",
    ]);

    if (error || !data) {
      dLog("Error starring thread");
      return { data: null, error };
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
    }
  } else if (provider === "outlook") {
    // In outlook, starring = flagging the most recent message not sent by active user
    const message = await db.messages
      .where("threadId")
      .equals(threadId)
      .filter((message) => message.from !== email)
      .reverse()
      .sortBy("date")
      .then((messages) => {
        return messages[0];
      });

    if (!message) {
      dLog("Error starring thread");
      return { data: null, error: "Error starring thread" };
    }

    try {
      await mStarMessage(accessToken, message.id, true);
      await db.messages.update(message.id, {
        labelIds: addLabelIdsOutlook(message.labelIds, "STARRED"),
      });
    } catch (e) {
      dLog("Error starring thread");
      return { data: null, error: "Error starring thread" };
    }
  }

  return { data: null, error: null };
}

export async function unstarThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await removeLabelIds(accessToken, threadId, [
      "STARRED",
    ]);

    if (error || !data) {
      dLog("Error unstarring thread");
      return { data: null, error };
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
    }
  } else {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const apiPromises = messages.map((message) => {
      return mStarMessage(accessToken, message.id, false);
    });

    const updateDexiePromises = messages.map((message) => {
      return db.messages.update(message.id, {
        labelIds: removeLabelIdsOutlook(message.labelIds, "STARRED"),
      });
    });

    try {
      await Promise.all(apiPromises);
      await Promise.all(updateDexiePromises);
    } catch (e) {
      dLog("Error starring thread");
      return { data: null, error: "Error unstarring thread" };
    }
  }

  return { data: null, error: null };
}

export async function archiveThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await removeLabelIds(accessToken, threadId, [
      "INBOX",
    ]);

    if (error || !data) {
      dLog("Error archiving thread");
      return { data: null, error };
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
    }
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const apiPromises = messages.map((message) => {
      return mMoveMessage(
        accessToken,
        message.id,
        OUTLOOK_FOLDER_IDS_MAP.getValue(FOLDER_IDS.DONE) || ""
      );
    });

    try {
      await Promise.all(apiPromises);
    } catch (e) {
      dLog("Error archiving thread");
      return { data: null, error: "Error archiving thread" };
    }
  }

  return { data: null, error: null };
}

export async function sendReply(
  email: string,
  provider: "google" | "outlook",
  message: IMessage,
  html: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const from = email;
    const to =
      getMessageHeader(message.headers, "From").match(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      )?.[0] ||
      getMessageHeader(message.headers, "To") ||
      "";
    const subject = getMessageHeader(message.headers, "Subject");
    const headerMessageId = getMessageHeader(message.headers, "Message-ID");
    const threadId = message.threadId;

    return await gSendReply(
      accessToken,
      from,
      [to],
      subject,
      headerMessageId,
      threadId,
      html
    );
  } else if (provider === "outlook") {
    const subject = getMessageHeader(message.headers, "Subject");
    const messageId = message.id;

    try {
      await mSendReply(accessToken, subject, messageId, html);
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error sending reply" };
    }
  }

  return { data: null, error: "Not implemented" };
}

export async function sendReplyAll(
  email: string,
  provider: "google" | "outlook",
  message: IMessage,
  html: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const from = email;
    const to = getToRecipients(message, email);
    const subject = getMessageHeader(message.headers, "Subject");
    const headerMessageId = getMessageHeader(message.headers, "Message-ID");
    const threadId = message.threadId;

    return await gSendReply(
      accessToken,
      from,
      to,
      subject,
      headerMessageId,
      threadId,
      html
    );
  } else if (provider === "outlook") {
    const subject = getMessageHeader(message.headers, "Subject");
    const messageId = message.id;

    try {
      await mSendReplyAll(accessToken, subject, messageId, html);
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error sending reply" };
    }
  }

  return { data: null, error: "Not implemented" };
}

export async function forward(
  email: string,
  provider: "google" | "outlook",
  message: IMessage,
  toRecipients: string[],
  html: string
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const from = email;
    const subject = getMessageHeader(message.headers, "Subject");
    const forwardHTML = await buildForwardedHTML(message, html);

    return await gForward(
      accessToken,
      from,
      toRecipients,
      subject,
      decodeURIComponent(encodeURIComponent(forwardHTML))
    );
  } else if (provider === "outlook") {
    try {
      await mForward(accessToken, message.id, toRecipients);
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error forwarding message" };
    }
  }

  return { data: null, error: "Not implemented" };
}

export async function sendEmail(
  email: string,
  provider: "google" | "outlook",
  to: string,
  subject: string,
  html: string
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    return await gSendEmail(accessToken, email, to, subject, html);
  } else if (provider === "outlook") {
    try {
      await mSendEmail(accessToken, to, subject, html);

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error sending email" };
    }
  }

  return { data: null, error: "Not implemented" };
}

export async function sendEmailWithAttachments(
  email: string,
  provider: "google" | "outlook",
  to: string,
  subject: string,
  html: string,
  attachments: NewAttachment[]
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    return await gSendEmailWithAttachments(
      accessToken,
      email,
      to,
      subject,
      html,
      attachments
    );
  } else if (provider === "outlook") {
    try {
      await mSendEmailWithAttachments(
        accessToken,
        to,
        subject,
        html,
        attachments
      );

      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error sending email" };
    }
  }

  return { data: null, error: "Error sending email" };
}

export async function deleteThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string,
  shouldToast = true
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    const { error } = await gDeleteThread(accessToken, threadId);

    if (error) {
      return;
    }
  } else if (provider === "outlook") {
    const messages = await mThreadList(
      accessToken,
      `messages?$select=id&$filter=conversationId eq '${threadId}'`
    );

    if (!messages || !messages.value) return;
    const promises = messages.value.map((message) => {
      return mDeleteMessage(accessToken, message.id);
    });

    try {
      await Promise.all(promises);
    } catch (e) {
      dLog("Error deleting thread");
    }
  }

  if (shouldToast) {
    toast.success("Deleted thread");
  }
}

export async function trashThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    const { data, error } = await gTrashThread(accessToken, threadId);

    if (error || !data) {
      dLog("Error trashing thread");
      return { data: null, error };
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
    }
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const apiPromises = messages.map((message) => {
      return mMoveMessage(
        accessToken,
        message.id,
        OUTLOOK_FOLDER_IDS_MAP.getValue(FOLDER_IDS.TRASH) || ""
      );
    });

    try {
      await Promise.all(apiPromises);
    } catch (e) {
      dLog("Error deleting thread");
      return { data: null, error: "Error deleting thread" };
    }
  }

  toast.success("Trashed thread");
  return { data: null, error: null };
}

export async function downloadAttachment(
  email: string,
  provider: "google" | "outlook",
  messageId: string,
  attachmentId: string,
  filename: string
): Promise<{ fileName: string; error: string | null }> {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await gAttachmentGet(
      accessToken,
      messageId,
      attachmentId
    );

    if (error || !data) {
      dLog("Error downloading attachment");
      return { fileName: "", error };
    } else {
      // true if file was saved successfully, false otherwise
      const fileName = await window.electron.ipcRenderer.invoke(
        "save-file",
        filename,
        data.data
      );

      dLog("saving file:", fileName);
      return { fileName, error: null };
    }
  } else if (provider === "outlook") {
    const { data, error } = await mAttachmentGet(
      accessToken,
      messageId,
      attachmentId
    );

    if (error || !data) {
      dLog("Error downloading attachment");
      return { fileName: "", error };
    } else {
      // true if file was saved successfully, false otherwise
      const fileName = await window.electron.ipcRenderer.invoke(
        "save-file",
        filename,
        data.contentBytes
      );

      dLog("saving file:", fileName);
      return { fileName, error: null };
    }
  }

  return { fileName: "", error: "Not implemented" };
}

export async function loadContacts(
  email: string,
  provider: "google" | "outlook"
) {
  const accessToken = await getAccessToken(email);
  // so we don't have duplicates when loading contacts from multiple sources
  const emailContactsMap = new Map<string, IContact>();

  if (provider === "google") {
    const contactListData = await gContactList(accessToken);
    const ldpData = await listDirectoryPeople(accessToken);
    const otherContactsData = await listOtherContacts(accessToken);

    const contacts = [];

    if (contactListData.error || !contactListData.data) {
      dLog("Error loading gmail contactList contacts");
    }

    if (ldpData.error || !ldpData.data) {
      dLog("Error loading gmail listDiscoveryPeople contacts");
    }

    if (otherContactsData.error || !otherContactsData.data) {
      dLog("Error loading gmail listOtherContacts contacts");
    }

    if (contactListData.data && contactListData.data.connections) {
      contacts.push(...contactListData.data.connections);
    }

    if (ldpData.data && ldpData.data.people) {
      contacts.push(...ldpData.data.people);
    }

    if (otherContactsData.data && otherContactsData.data.otherContacts) {
      contacts.push(...otherContactsData.data.otherContacts);
    }

    for (const contact of contacts) {
      const contactName = contact.names?.[0]?.displayName || "";
      for (const contactEmail of contact.emailAddresses) {
        if (!emailContactsMap.has(contactEmail.value)) {
          emailContactsMap.set(contactEmail.value, {
            email: email,
            contactName: contactName,
            contactEmailAddress: contactEmail.value,
            isSavedContact: true,
            lastInteraction: 0,
          });
        }
      }
    }
  } else if (provider === "outlook") {
    const { data, error } = await mContactsList(accessToken);

    if (error || !data) {
      dLog("Error loading contacts");
      return { data: null, error };
    }

    for (const contact of data) {
      for (const contactEmail of contact.emailAddresses) {
        if (!emailContactsMap.has(contactEmail.address)) {
          emailContactsMap.set(contactEmail.address, {
            email: email,
            contactName: contact.displayName,
            contactEmailAddress: contactEmail.address,
            isSavedContact: true,
            lastInteraction: 0,
          });
        }
      }
    }
  }

  await db.contacts.bulkPut(Array.from(emailContactsMap.values()));
  return { data: null, error: null };
}

export async function watchSubscription(
  email: string,
  provider: "google" | "outlook"
) {
  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    return watchGmail(accessToken, email);
  } else if (provider === "outlook") {
    // Get list of subscriptions
    const { data, error } = await mSubscriptionsList(accessToken);

    if (error || data === null) {
      dLog("Error getting subscriptions");
      return { data: null, error };
    }

    // Filter for inbox subscriptions that are still active
    const activeSubscriptions = data.filter(
      (s) =>
        s.expirationDateTime > new Date().toISOString() &&
        s.resource === "me/messages"
    );
    if (activeSubscriptions.length > 0) {
      // Update expiration date time to 3 days from now
      const newExpirationDateTime = getOutlookSubscriptionExpirationDateTime();
      return await mSubscriptionsUpdateExpirationDateTime(
        accessToken,
        activeSubscriptions[0].id,
        newExpirationDateTime
      );
    } else {
      // Create new subscription
      return await mSubscriptionsCreate(accessToken, email);
    }
  }

  return { data: null, error: "Not implemented" };
}

export async function search(
  email: string,
  provider: "google" | "outlook",
  searchItems: string[]
) {
  // const accessToken = await getAccessToken(email);

  const searchQuery = buildSearchQuery(provider, searchItems);
  // const filter: IThreadFilter = {
  //   folderId: FOLDER_IDS.INBOX,
  //   gmailQuery: searchQuery,
  //   outlookQuery: searchQuery,
  // };

  void saveSearchQuery(email, searchItems);
  void getThreadsExhaustive(email, provider, searchQuery, []);

  // if (provider === "google") {
  // Should we call exhaustive here or call the list endpoint directly for pagination
  // // TODO: remove this necause gThreadList is not necessary
  // const tList = await gThreadList(accessToken, filter);
  // if (tList.error || !tList.data) {
  //   // TODO: send error syncing mailbox
  //   return;
  // }
  // const threadIds = tList.data.threads
  //   ? tList.data.threads.map((thread) => thread.id)
  //   : [];
  // if (threadIds.length > 0) {
  //   await handleNewThreadsGoogle(accessToken, email, threadIds);
  // }
  // } else if (provider === "outlook") {
  // const { data, error } = await mThreadList(accessToken, filter);
  // if (error || !data) {
  //   dLog("Error searching mailbox");
  //   return { data: [], error };
  // }
  // const threadIds = _.uniq(data.value.map((thread) => thread.conversationId));
  // let parsedThreads: IEmailThread[] = [];
  // if (threadIds.length > 0) {
  //   parsedThreads = await handleNewThreadsOutlook(
  //     accessToken,
  //     email,
  //     threadIds
  //     // filter
  //   );
  // }
  // return { data: parsedThreads, error: null };
  // }

  return { data: [], error: null };
}

export async function createDraft(
  email: string,
  provider: "google" | "outlook",
  toRecipients: string[],
  subject: string,
  content: string
  // attachments: NewAttachment[]
) {
  if (
    toRecipients.length === 0 &&
    !subject &&
    !content
    // attachments.length === 0
  ) {
    dLog("Empty draft");
    return { data: null, error: "No recipients provided" };
  }

  let resp: CreateDraftResponseDataType | null = null;

  const accessToken = await getAccessToken(email);
  if (provider === "google") {
    const { data, error } = await gDraftCreate(
      accessToken,
      email,
      toRecipients.join(","),
      subject,
      content
      // attachments
    );

    if (error || !data) {
      dLog("Error creating draft");
      return { data: null, error: "Error creating draft" };
    }

    resp = {
      id: data.id || "",
      threadId: data.message?.threadId || "",
    };
  } else {
    try {
      const draft = await mDraftCreate(
        accessToken,
        toRecipients,
        subject,
        content
        // attachments
      );

      if (!draft) return { data: null, error: "Error creating draft" };

      resp = {
        id: draft.id || "",
        threadId: draft.conversationId || "",
      };
    } catch (e) {
      dLog("Error creating draft");
      return { data: null, error: "Error creating draft" };
    }
  }

  return { data: resp, error: null };
}

export async function updateDraft(
  email: string,
  provider: "google" | "outlook",
  messageId: string,
  toRecipients: string[],
  subject: string,
  content: string
  // attachments: NewAttachment[]
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    return await gDraftUpdate(
      accessToken,
      messageId,
      email,
      toRecipients.join(","),
      subject,
      content
      // attachments
    );
  } else {
    try {
      const data = await mDraftUpdate(
        accessToken,
        messageId,
        toRecipients,
        subject,
        content
        // attachments
      );

      return { data, error: null };
    } catch (e) {
      dLog("Error updating draft");
      return { data: null, error: "Error updating draft" };
    }
  }
}

export async function deleteDraft(
  email: string,
  provider: "google" | "outlook",
  messageId: string
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    return await gDraftDelete(accessToken, messageId);
  } else {
    try {
      await mDeleteMessage(accessToken, messageId);

      return { data: null, error: null };
    } catch (e) {
      dLog("Error deleting draft");
      return { data: null, error: "Error deleting draft" };
    }
  }
}

export async function sendDraft(
  email: string,
  provider: "google" | "outlook",
  messageId: string
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    // TODO: not implemented
  } else {
    try {
      await mDraftSend(accessToken, messageId);

      return { data: null, error: null };
    } catch (e) {
      dLog("Error sending draft");
      return { data: null, error: "Error sending draft" };
    }
  }

  return { data: null, error: null };
}
