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
  deleteMessage as mDeleteMessage,
  moveMessage as mMoveMessage,
  starMessage as mStarMessage,
} from "../api/outlook/users/threads";
import {
  buildMessageHeadersOutlook,
  buildMessageLabelIdsOutlook,
  addLabelIdsOutlook,
  removeLabelIdsOutlook,
  getFolderNameFromIdOutlook,
} from "../api/outlook/helpers";

import { getAccessToken } from "../api/accessToken";
import { IAttachment, IEmailThread, IMessage, db } from "./db";
import {
  getGoogleMetaData,
  getOutlookMetaData,
  setPageToken,
  setHistoryId,
} from "./dexie/helpers";
import { getMessageHeader, upsertLabelIds } from "./util";
import _ from "lodash";
import { dLog } from "./noProd";
import { IThreadFilter } from "../api/model/users.thread";
import { ID_DONE, ID_INBOX, ID_TRASH, ID_SENT } from "../api/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { getAttachment } from "../api/gmail/users/messages";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";

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
      if (filter.folderId === ID_DONE && hasInboxLabel) {
        return;
      }
      // thread history id i think will be max of all messages' history ids
      if (parseInt(thread.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(thread.historyId);
      }

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
      });
    });

    await setHistoryId(email, "google", filter.folderId, maxHistoryId);

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
  // const promises = threadsIds.map((threadId) =>

  try {
    // Outlook throttle limit is 4 concurrent requests
    const threads = await batchGetThreads(accessToken, threadsIds, 4);

    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];
    for (const thread of threads) {
      let unread = false;
      let isStarred = false;
      let labelIds: string[] = [];
      for (const message of thread.value) {
        if (!message.isRead) {
          unread = true;
        }
        if (message.flag && message.flag.flagStatus === "flagged") {
          isStarred = true;
        }
      }

      if (isStarred) labelIds = upsertLabelIds(labelIds, "STARRED");
      if (unread) labelIds = upsertLabelIds(labelIds, "UNREAD");

      for (const message of thread.value) {
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
          labelIds: buildMessageLabelIdsOutlook(message, filter.folderId),
          from:
            message.from?.emailAddress?.address ||
            message.sender?.emailAddress?.address ||
            "No Sender",
          toRecipients: message.toRecipients.map(m => m.emailAddress.address), // TODO: add multiple recipients
          snippet: message.bodyPreview || "",
          headers: buildMessageHeadersOutlook(message),
          textData,
          htmlData,
          date: new Date(message.receivedDateTime).getTime(),
          attachments: [], // TODO: implement for outlook
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
      });
    }

    await db.emailThreads.bulkPut(parsedThreads);
    await db.messages.bulkPut(parsedMessages);
  } catch (e) {
    dLog("Could not sync mailbox");
    dLog(e);
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
    dLog("no metadata");
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

  const tList = await gThreadListNextPage(accessToken, metadata.token, filter);

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

async function updateLabelIdsForEmailThread(
  threadId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
) {
  const thread = await db.emailThreads.get(threadId);
  if (!thread) {
    dLog("no thread");
    return;
  }

  const labelIds = thread.labelIds
    .filter((labelId) => !removeLabelIds?.includes(labelId))
    .concat(addLabelIds);

  await db.emailThreads.update(threadId, { labelIds });
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
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await updateLabelIdsForEmailThread(threadId, ["STARRED"], []);
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
      return;
    }

    try {
      await mStarMessage(accessToken, message.id, true);
      await db.messages.update(message.id, {
        labelIds: addLabelIdsOutlook(message.labelIds, "STARRED"),
      });
      await updateLabelIdsForEmailThread(threadId, ["STARRED"], []);
    } catch (e) {
      dLog("Error starring thread");
    }
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
      dLog("Error unstarring thread");
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await updateLabelIdsForEmailThread(threadId, [], ["STARRED"]);
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
      await updateLabelIdsForEmailThread(threadId, [], ["STARRED"]);
    } catch (e) {
      dLog("Error starring thread");
    }
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
      await updateLabelIdsForEmailThread(
        threadId,
        [ID_DONE],
        [ID_INBOX, ID_SENT]
      ); // TODO: set up proper archive folder?
      const res = await addLabelIds(accessToken, threadId, ["ARCHIVE"]);

      if (res.error || !res.data) {
        dLog("Error adding DONE label to thread:");
        dLog(res.error);
        return;
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
        OUTLOOK_FOLDER_IDS_MAP.getValue(ID_DONE) || ""
      );
    });

    const updateDexiePromises = messages.map(() => {
      return updateLabelIdsForEmailThread(
        threadId,
        [ID_DONE],
        [ID_INBOX, ID_SENT]
      );
    });

    try {
      await Promise.all(apiPromises);
      await Promise.all(updateDexiePromises);
      await updateLabelIdsForEmailThread(
        threadId,
        [ID_DONE],
        [ID_INBOX, ID_SENT]
      );
    } catch (e) {
      dLog("Error archiving thread");
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
      return;
    } else {
      const promises = data.messages.map((message) => {
        return db.messages.update(message.id, {
          labelIds: message.labelIds,
        });
      });

      await Promise.all(promises);
      await updateLabelIdsForEmailThread(
        threadId,
        [ID_TRASH],
        [ID_INBOX, ID_SENT]
      );
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
        OUTLOOK_FOLDER_IDS_MAP.getValue(ID_TRASH) || ""
      );
    });

    // Update labelIds in dexie
    const updateDexiePromises = messages.map(() => {
      return updateLabelIdsForEmailThread(
        threadId,
        [ID_TRASH],
        [ID_INBOX, ID_SENT]
      );
    });

    try {
      await Promise.all(apiPromises);
      await Promise.all(updateDexiePromises);
      await updateLabelIdsForEmailThread(
        threadId,
        [ID_TRASH],
        [ID_INBOX, ID_SENT]
      );
    } catch (e) {
      dLog("Error deleting thread");
    }
  }
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
    const { data, error } = await getAttachment(
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
    // TODO
  }

  return false;
}
