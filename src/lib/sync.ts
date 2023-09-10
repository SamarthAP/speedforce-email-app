import {
  deleteThread as gDeleteThread,
  get as gThreadGet,
  list as gThreadList,
  listNextPage as gThreadListNextPage,
  removeLabelIds,
  sendReply as gSendReply,
  sendEmail as gSendEmail,
  trashThread as gTrashThread,
  addLabelIds,
} from "../api/gmail/users/threads";
import { list as gHistoryList } from "../api/gmail/users/history";

import {
  get as mThreadGet,
  list as mThreadList,
  listNextPage as mThreadListNextPage,
  markRead as mThreadMarkRead,
  sendReply as mSendReply,
  sendEmail as mSendEmail,
  buildMessageHeadersOutlook,
  deleteMessage as mDeleteMessage,
  moveMessage as mMoveMessage,
} from "../api/outlook/users/threads";

import { getAccessToken } from "../api/accessToken";
import { IEmailThread, IMessage, db } from "./db";
import {
  getGoogleMetaData,
  getOutlookMetaData,
  setPageToken,
  setHistoryId,
} from "./dexieHelpers";
import { getMessageHeader } from "./util";
import _ from "lodash";
import { dLog } from "./noProd";
import { IThreadFilter } from "../api/model/users.thread";
import { ID_DONE, ID_TRASH } from "../api/constants";
import { getInboxName } from "../api/outlook/constants";

async function handleNewThreadsGoogle(
  accessToken: string,
  email: string,
  threadIds: string[],
  filter: IThreadFilter
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
      // thread history id i think will be max of all messages' history ids
      if (parseInt(thread.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(thread.historyId);
      }

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
        unread: thread.messages[lastMessageIndex].labelIds.includes("UNREAD"),
        folderId: filter.folderId,
        starred: thread.messages.reduce((acc, message) => {
          if (message.labelIds.includes("STARRED")) {
            return true;
          } else {
            return acc;
          }
        }, false),
      });

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
        });

        if (htmlData === "") {
          htmlData = message.payload.body.data || "";
        }

        parsedMessages.push({
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          from: getMessageHeader(message.payload.headers, "From"),
          to: getMessageHeader(message.payload.headers, "To"),
          snippet: message.snippet || "",
          headers: message.payload.headers,
          textData,
          htmlData,
          date: parseInt(message.internalDate),
        });
      });
    });

    await setHistoryId(email, "google", filter.folderId, maxHistoryId);

    // save threads
    await db.emailThreads.bulkPut(parsedThreads);
    await db.messages.bulkPut(parsedMessages);

    return;
  } catch (e) {
    console.log("Could not sync mailbox");
    console.log(e);
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
      console.log("Error getting batch threads");
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
  // const promises = threadsIds.map((threadId) =>

  try {
    // Outlook throttle limit is 4 concurrent requests
    const threads = await batchGetThreads(accessToken, threadsIds, 4);

    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];
    threads.forEach((thread) => {
      const lastMessageIndex = thread.value.length - 1;

      let unread = false;
      const starred = false; // TODO: change to 'let' and implement starred
      for (const message of thread.value) {
        if (!message.isRead) {
          unread = true;
          break;
        }
      }

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
        folderId: filter.folderId,
        starred: starred,
      });

      thread.value.forEach((message) => {
        let textData = "";
        let htmlData = "";

        if (message.body.contentType === "plain") {
          textData = message.body.content || "";
        } else if (message.body.contentType === "html") {
          htmlData = message.body.content || "";
        }

        // TODO: Add CC, BCC, attachments, etc.
        parsedMessages.push({
          id: message.id,
          threadId: message.conversationId,
          // labelIds: message.labelIds,
          labelIds: [],
          from:
            message.from?.emailAddress?.address ||
            message.sender?.emailAddress?.address ||
            "No Sender",
          to: message.toRecipients[0]?.emailAddress.address || "No Recipient", // TODO: add multiple recipients
          snippet: message.bodyPreview || "",
          headers: buildMessageHeadersOutlook(message),
          textData,
          htmlData,
          date: new Date(message.receivedDateTime).getTime(),
        });
      });
    });

    await db.emailThreads.bulkPut(parsedThreads);
    await db.messages.bulkPut(parsedMessages);
  } catch (e) {
    console.log("Could not sync mailbox");
    console.log(e);
    return;
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
    await handleNewThreadsGoogle(accessToken, email, threadIds, filter);
  }
}

async function fullSyncOutlook(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);

  // get a list of thread ids
  const tList = await mThreadList(accessToken, filter);

  if (tList.error || !tList.data) {
    // TODO: send error syncing mailbox
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await setPageToken(email, "outlook", filter.folderId, nextPageToken);

  const threadIds = _.uniq(
    tList.data.value.map((thread) => thread.conversationId)
  );

  if (threadIds.length > 0) {
    await handleNewThreadsOutlook(accessToken, email, threadIds, filter);
  }
}

async function partialSyncGoogle(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);
  const metadata = await getGoogleMetaData(email, filter.folderId);

  if (!metadata) {
    console.log("no metadata");
    return;
  }

  const hList = await gHistoryList(accessToken, metadata.historyId);

  if (hList.error || !hList.data) {
    return;
  }

  const newThreadIds = new Set<string>();

  hList.data.history.forEach((historyItem) => {
    if (historyItem.messagesAdded) {
      historyItem.messagesAdded.forEach((addedMessage) => {
        // TODO: could take other message info from here but probably not necessary
        newThreadIds.add(addedMessage.message.threadId);
      });
    }
  });

  if (newThreadIds.size > 0) {
    await handleNewThreadsGoogle(
      accessToken,
      email,
      Array.from(newThreadIds),
      filter
    );
  }
}

async function partialSyncOutlook(email: string, filter: IThreadFilter) {
  // TODO: research and implement partial sync for outlook
  // Delta tokens not applicable for mail, only calendar

  await fullSyncOutlook(email, filter);
}

async function loadNextPageGoogle(email: string, filter: IThreadFilter) {
  const accessToken = await getAccessToken(email);
  const metadata = await getGoogleMetaData(email, filter.folderId);

  if (!metadata) {
    dLog("no metadata");
    return;
  }

  const tList = await gThreadListNextPage(accessToken, metadata.token);

  if (tList.error || !tList.data) {
    dLog("error loading next page:", tList.error);
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await setPageToken(email, "google", filter.folderId, nextPageToken);

  const threadIds = tList.data.threads.map((thread) => thread.id);

  if (threadIds.length > 0) {
    await handleNewThreadsGoogle(accessToken, email, threadIds, filter);
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
      console.log("Error marking thread as read");
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

    // mark all messages in conversation as read since isRead is tied to the message, not the thread
    // TODO: error handling
    await Promise.all(apiPromises);
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
      console.log("Error starring thread");
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await db.emailThreads.update(threadId, { starred: true });
    }
  } else {
    console.log("Error starring thread");
  }
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
      console.log("Error unstarring thread");
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await db.emailThreads.update(threadId, { starred: false });
    }
  } else {
    console.log("Error unstarring thread");
  }
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
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await db.emailThreads.update(threadId, { folderId: "ARCHIVE" }); // TODO: set up proper archive folder?
    }
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const promises = messages.map((message) => {
      return mMoveMessage(accessToken, message.id, getInboxName(ID_DONE));
    });

    try {
      await Promise.all(promises);
      await db.emailThreads.update(threadId, { folderId: ID_DONE }); // TODO: set up proper trash folder?
    } catch (e) {
      console.log("Error archiving thread");
    }
  }
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
      getMessageHeader(message.headers, "From").match(/<([^>]+)>/)?.[1] ||
      getMessageHeader(message.headers, "To") ||
      "";
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
      await mSendReply(accessToken, subject, messageId, html);
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: "Error sending reply" };
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
      return { data: null, error: "Error sending reply" };
    }
  }

  return { data: null, error: "Not implemented" };
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
      console.log("Error deleting thread");
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
      console.log("Error trashing thread");
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await db.emailThreads.update(threadId, { folderId: ID_TRASH }); // TODO: set up proper trash folder?
    }
  } else if (provider === "outlook") {
    const messages = await db.messages
      .where("threadId")
      .equals(threadId)
      .toArray();

    const promises = messages.map((message) => {
      return mMoveMessage(accessToken, message.id, getInboxName(ID_TRASH));
    });

    try {
      await Promise.all(promises);
      await db.emailThreads.update(threadId, { folderId: ID_TRASH }); // TODO: set up proper trash folder?
    } catch (e) {
      console.log("Error deleting thread");
    }
  }
}
