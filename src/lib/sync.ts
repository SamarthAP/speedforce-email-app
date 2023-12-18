import {
  deleteThread as gDeleteThread,
  get as gThreadGet,
  list as gThreadList,
  listNextPage as gThreadListNextPage,
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
import { list as gHistoryList } from "../api/gmail/users/history";
import {
  list as gContactList,
  listDirectoryPeople,
  listOtherContacts,
} from "../api/gmail/people/contact";
import { watch as watchGmail } from "../api/gmail/notifications/pushNotifications";
import { getToRecipients, buildForwardedHTML } from "../api/gmail/helpers";

import {
  get as mThreadGet,
  list as mThreadList,
  listNextPage as mThreadListNextPage,
  markRead as mThreadMarkRead,
  forward as mForward,
  deleteMessage as mDeleteMessage,
  moveMessage as mMoveMessage,
  starMessage as mStarMessage,
} from "../api/outlook/users/threads";
import {
  sendEmail as mSendEmail,
  sendEmailWithAttachments as mSendEmailWithAttachments,
  sendReply as mSendReply,
  sendReplyAll as mSendReplyAll,
} from "../api/outlook/users/message";
import {
  list as mAttachmentList,
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
  getOutlookHistoryIdFromDateTime,
  getOutlookSubscriptionExpirationDateTime,
} from "../api/outlook/helpers";

import { getAccessToken } from "../api/accessToken";
import { IAttachment, IContact, IEmailThread, IMessage, db } from "./db";
import {
  getGoogleMetaData,
  getOutlookMetaData,
  setPageToken,
  setHistoryId,
} from "./dexie/helpers";
import { buildSearchQuery, getMessageHeader, upsertLabelIds } from "./util";
import _ from "lodash";
import { dLog } from "./noProd";
import {
  IThreadFilter,
  OutlookThreadsListDataType,
} from "../api/model/users.thread";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { NewAttachment } from "../components/WriteMessage";
import toast from "react-hot-toast";

const MAX_PARTIAL_SYNC_LOOPS = 10;

async function handleNewThreadsGoogle(
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
      let hasInboxLabel = false;
      let isStarred = false;
      let labelIds: string[] = [];
      for (const message of thread.messages) {
        if (message.labelIds?.includes("INBOX")) {
          hasInboxLabel = true;
        }
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
          toRecipients: [getMessageHeader(message.payload.headers, "To")],
          snippet: message.snippet || "",
          headers: message.payload.headers,
          textData,
          htmlData,
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

    await setHistoryId(email, "google", maxHistoryId);

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
  batchSize = 4
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

async function handleNewThreadsOutlook(
  accessToken: string,
  email: string,
  threadsIds: string[],
  filter: IThreadFilter
) {
  try {
    // Outlook throttle limit is 4 concurrent requests
    const threads = await batchGetThreads(accessToken, threadsIds, 4);

    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];
    for (const thread of threads) {
      let unread = false;
      let isStarred = false;
      let isImportant = false;
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

        let attachments: IAttachment[] = [];
        // List attachments
        if (message.hasAttachments) {
          const { data, error } = await mAttachmentList(
            accessToken,
            message.id
          );

          if (data && !error) {
            // attachments.data.value.forEach((attachment) => {
            attachments = data.map((attachment) => {
              return {
                filename: attachment.name,
                mimeType: attachment.contentType,
                attachmentId: attachment.id,
                size: attachment.size,
              };
            });
          } else {
            dLog("Error getting attachments");
          }
        }

        // TODO: Add CC, BCC, attachments, etc.
        parsedMessages.push({
          id: message.id,
          threadId: message.conversationId,
          labelIds: buildMessageLabelIdsOutlook(message, filter.folderId),
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
        hasAttachments: false, // TODO: implement for outlook
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

async function fullSyncGoogle(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);

  // get a list of thread ids
  const tList = await gThreadList(accessToken, filter);

  if (tList.error || !tList.data) {
    // TODO: send error syncing mailbox
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await setPageToken(email, "google", filter.folderId, nextPageToken);

  const threadIds = tList.data.threads
    ? tList.data.threads.map((thread) => thread.id)
    : [];

  if (threadIds.length > 0) {
    await handleNewThreadsGoogle(accessToken, email, threadIds);
  }
}

async function fullSyncOutlook(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);

  // get a list of thread ids
  const { data, error } = await mThreadList(accessToken, filter);

  if (error || !data) {
    // TODO: send error syncing mailbox
    return;
  }

  // Set page token and update historyId
  // Not ideal as it is possible to miss some threads in other folders and still update hsitoryId
  // A partial sync will fix this in almost all cases (unlikely to get an updates with > 20 new emails)
  // TODO: fix this by deprecating full sync in v0.1.*
  const nextPageToken = data.nextPageToken;
  await setPageToken(email, "outlook", filter.folderId, nextPageToken);

  const firstDatetime = getOutlookHistoryIdFromDateTime(
    data.value[data.value.length - 1]?.createdDateTime
  );
  await setHistoryId(email, "outlook", firstDatetime);

  const threadIds = _.uniq(data.value.map((thread) => thread.conversationId));

  if (threadIds.length > 0) {
    await handleNewThreadsOutlook(accessToken, email, threadIds, filter);
  }
}

async function partialSyncGoogle(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);
  const metadata = await db.googleMetadata.where("email").equals(email).first();

  if (!metadata) {
    dLog("no metadata");
    return;
  }

  // If never queried, call a full sync
  if (
    metadata.threadsListNextPageTokens.findIndex(
      (t) => t.folderId == filter?.folderId
    ) === -1
  ) {
    await fullSyncGoogle(email, filter);
    return;
  }

  const hList = await gHistoryList(accessToken, metadata.historyId);

  if (hList.error || !hList.data) {
    return;
  }

  const newThreadIds = new Set<string>();

  hList.data.history?.forEach((historyItem) => {
    if (historyItem.messagesAdded) {
      historyItem.messagesAdded.forEach((addedMessage) => {
        // TODO: could take other message info from here but probably not necessary
        newThreadIds.add(addedMessage.message.threadId);
      });
    }
  });

  if (newThreadIds.size > 0) {
    await handleNewThreadsGoogle(accessToken, email, Array.from(newThreadIds));
  }
}

async function partialSyncOutlook(email: string, filter: IThreadFilter) {
  // Use timestamp as historyId. Partial sync will not use filterData (sync all inboxes)
  // TODO: Spike on whether to implement a message limit? API throttling shouldn't be an issue (4 concurrent requests)
  const accessToken = await getAccessToken(email);

  const targetHistoryId = await db.outlookMetadata
    .where("email")
    .equals(email)
    .first();

  // If no historyId, do a full sync
  if (
    !targetHistoryId ||
    !targetHistoryId.historyId ||
    parseInt(targetHistoryId.historyId) === 0
  ) {
    dLog("no metadata. Doing a full sync");
    await fullSyncOutlook(email, filter);
    return;
  }

  let data: OutlookThreadsListDataType | null = null;
  let error: string | null = null;

  // Fetch the top 20 threads
  ({ data, error } = await mThreadList(accessToken, filter));

  if (error || !data) {
    dLog("Error syncing mailbox");
    return;
  }

  const threadIds = _.uniq(data.value.map((thread) => thread.conversationId));
  if (threadIds.length > 0) {
    await handleNewThreadsOutlook(accessToken, email, threadIds, filter);
  }

  let firstDatetime = getOutlookHistoryIdFromDateTime(
    data.value[data.value.length - 1]?.createdDateTime
  );

  // Until we reach the target historyId, fetch the next page of threads
  let partialSyncLoops = 0;
  while (
    firstDatetime > parseInt(targetHistoryId.historyId) &&
    partialSyncLoops < MAX_PARTIAL_SYNC_LOOPS
  ) {
    partialSyncLoops++;

    ({ data, error } = await mThreadListNextPage(
      accessToken,
      data?.nextPageToken || ""
    ));

    if (error || !data) {
      continue;
    }

    firstDatetime = getOutlookHistoryIdFromDateTime(
      data.value[data.value.length - 1]?.createdDateTime
    );

    const threadIds = _.uniq(data.value.map((thread) => thread.conversationId));

    if (threadIds.length > 0) {
      await handleNewThreadsOutlook(accessToken, email, threadIds, filter);
    }
  }
}

async function loadNextPageGoogle(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);
  const metadata = await getGoogleMetaData(email, filter.folderId);

  if (!metadata) {
    dLog("no metadata");
    return;
  }

  const tList = await gThreadListNextPage(accessToken, metadata.token, filter);

  if (tList.error || !tList.data) {
    dLog("error loading next page:", tList.error);
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await setPageToken(email, "google", filter.folderId, nextPageToken);

  const threadIds = tList.data.threads.map((thread) => thread.id);

  if (threadIds.length > 0) {
    await handleNewThreadsGoogle(accessToken, email, threadIds);
  }
}

async function loadNextPageOutlook(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);

  const metadata = await getOutlookMetaData(email, filter.folderId);
  const nextPageToken = metadata?.token;
  if (!nextPageToken) {
    dLog("no page token");
    return;
  }

  const tList = await mThreadListNextPage(accessToken, nextPageToken);

  if (tList.error || !tList.data) {
    dLog("error loading next page:", tList.error);
    return;
  }

  const newNextPageToken = tList.data.nextPageToken;
  await setPageToken(email, "outlook", filter.folderId, newNextPageToken);

  const threadIds = _.uniq(
    tList.data.value.map((thread) => thread.conversationId)
  );
  if (threadIds.length > 0) {
    await handleNewThreadsOutlook(accessToken, email, threadIds, filter);
  }
}

export async function fullSync(
  email: string,
  provider: "google" | "outlook",
  filter: IThreadFilter
) {
  if (provider === "google") {
    await fullSyncGoogle(email, filter);
  } else if (provider === "outlook") {
    await fullSyncOutlook(email, filter);
  }
}

export async function partialSync(
  email: string,
  provider: "google" | "outlook",
  filter: IThreadFilter
) {
  if (provider === "google") {
    await partialSyncGoogle(email, filter);
  } else if (provider === "outlook") {
    await partialSyncOutlook(email, filter);
  }
}

export async function loadNextPage(
  email: string,
  provider: "google" | "outlook",
  filter: IThreadFilter
) {
  if (provider === "google") {
    await loadNextPageGoogle(email, filter);
  } else if (provider === "outlook") {
    await loadNextPageOutlook(email, filter);
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
      const res = await addLabelIds(accessToken, threadId, ["ARCHIVE"]);

      if (res.error || !res.data) {
        dLog("Error adding DONE label to thread:");
        dLog(res.error);
        return { data: null, error };
      } else {
        dLog("Added DONE label to thread:");
        dLog(res.data);
      }
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

  toast("Marked as done");
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
      unescape(encodeURIComponent(forwardHTML))
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
}

export async function deleteThread(
  email: string,
  provider: "google" | "outlook",
  threadId: string
) {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    const { error } = await gDeleteThread(accessToken, threadId);

    if (error) {
      return;
    }

    await db.messages.where("threadId").equals(threadId).delete();
    await db.emailThreads.delete(threadId);
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const promises = messages.map((message) => {
      return mDeleteMessage(accessToken, message.id);
    });

    try {
      await Promise.all(promises);

      // TODO: delete from db
      await db.messages.where("threadId").equals(threadId).delete();
      await db.emailThreads.delete(threadId);
    } catch (e) {
      dLog("Error deleting thread");
    }
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

  toast("Trashed thread");
  return { data: null, error: null };
}

export async function downloadAttachment(
  email: string,
  provider: "google" | "outlook",
  messageId: string,
  attachmentId: string,
  filename: string
): Promise<boolean> {
  const accessToken = await getAccessToken(email);

  if (provider === "google") {
    const { data, error } = await gAttachmentGet(
      accessToken,
      messageId,
      attachmentId
    );

    if (error || !data) {
      dLog("Error downloading attachment");
      return false;
    } else {
      // true if file was saved successfully, false otherwise
      const success = await window.electron.ipcRenderer.invoke(
        "save-file",
        filename,
        data.data
      );

      dLog("saving file:", success);
      return success;
    }
  } else if (provider === "outlook") {
    const { data, error } = await mAttachmentGet(
      accessToken,
      messageId,
      attachmentId
    );

    if (error || !data) {
      dLog("Error downloading attachment");
      return false;
    } else {
      // true if file was saved successfully, false otherwise
      const success = await window.electron.ipcRenderer.invoke(
        "save-file",
        filename,
        data.contentBytes
      );

      dLog("saving file:", success);
      return success;
    }
  }

  return false;
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
  const accessToken = await getAccessToken(email);

  // TODO: delete after inbox zero, since folderId will be deprecated
  const searchQuery = buildSearchQuery(provider, searchItems);
  const filter: IThreadFilter = {
    folderId: FOLDER_IDS.INBOX,
    gmailQuery: searchQuery,
    outlookQuery: searchQuery,
  };

  console.log(searchItems);
  console.log(filter);

  if (provider === "google") {
    // TODO: implement
  } else if (provider === "outlook") {
    const { data, error } = await mThreadList(accessToken, filter);

    console.log(data);
    if (error || !data) {
      dLog("Error searching mailbox");
      return { data: [], error };
    }

    const threadIds = _.uniq(data.value.map((thread) => thread.conversationId));

    let parsedThreads: IEmailThread[] = [];
    // if (threadIds.length > 0) {
    //   parsedThreads = await handleNewThreadsOutlook(
    //     accessToken,
    //     email,
    //     threadIds,
    //     filter
    //   );
    // }

    return { data: parsedThreads, error: null };
  }

  return { data: [], error: null };
}
