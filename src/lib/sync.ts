import {
  get as gThreadGet,
  list as gThreadList,
  listNextPage as gThreadListNextPage,
  removeLabelIds,
} from "../api/gmail/users/threads";
import { list as gHistoryList } from "../api/gmail/users/history";

import {
  get as mThreadGet,
  list as mThreadList,
  listNextPage as mThreadListNextPage,
  markRead as mThreadMarkRead,
} from "../api/outlook/users/threads";

import { getAccessToken } from "../api/accessToken";
import { IEmailThread, IMessage, db } from "./db";
import { getGoogleMessageHeader as getHeader } from "./util";
import _ from "lodash";

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
      // thread history id i think will be max of all messages' history ids
      if (parseInt(thread.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(thread.historyId);
      }

      const lastMessageIndex = thread.messages.length - 1;

      parsedThreads.push({
        id: thread.id,
        historyId: thread.historyId,
        email: email,
        from: getHeader(thread.messages[0].payload.headers, "From"),
        subject: getHeader(thread.messages[0].payload.headers, "Subject"),
        snippet: thread.messages[lastMessageIndex].snippet || "", // this should be the latest message's snippet
        date: parseInt(thread.messages[lastMessageIndex].internalDate),
        unread: thread.messages[lastMessageIndex].labelIds.includes("UNREAD"),
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
          from: getHeader(message.payload.headers, "From"),
          to: getHeader(message.payload.headers, "To"),
          snippet: message.snippet || "",
          headers: message.payload.headers,
          textData,
          htmlData,
          date: parseInt(message.internalDate),
        });
      });
    });

    await db.googleMetadata
      .where("email")
      .equals(email)
      .modify((row) => {
        if (parseInt(row.historyId) < maxHistoryId) {
          row.historyId = maxHistoryId.toString();
        }
      });

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

    const batchThreads = await Promise.all(promises);
    threads.push(...batchThreads);
  }

  return threads;
}

async function handleNewThreadsOutlook(
  accessToken: string,
  email: string,
  threadsIds: string[]
) {
  // const promises = threadsIds.map((threadId) =>

  try {
    // const threads = await Promise.all(promises);
    const threads = await batchGetThreads(accessToken, threadsIds, 5);

    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IMessage[] = [];
    threads.forEach((thread) => {
      const lastMessageIndex = thread.value.length - 1;

      let unread = false;
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
          headers: [],
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

async function fullSyncGoogle(email: string) {
  const accessToken = await getAccessToken(email);

  // get a list of thread ids
  const tList = await gThreadList(accessToken);

  if (tList.error || !tList.data) {
    // TODO: send error syncing mailbox
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await db.googleMetadata.update(email, {
    threadsListNextPageToken: nextPageToken,
  });

  const threadIds = tList.data.threads.map((thread) => thread.id);

  if (threadIds.length > 0) {
    await handleNewThreadsGoogle(accessToken, email, threadIds);
  }
}

async function fullSyncOutlook(email: string) {
  const accessToken = await getAccessToken(email);

  // get a list of thread ids
  const tList = await mThreadList(accessToken);

  if (tList.error || !tList.data) {
    // TODO: send error syncing mailbox
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await db.outlookMetadata.update(email, {
    threadsListNextPageToken: nextPageToken,
  });

  const threadIds = _.uniq(
    tList.data.value.map((thread) => thread.conversationId)
  );

  if (threadIds.length > 0) {
    await handleNewThreadsOutlook(accessToken, email, threadIds);
  }
}

async function partialSyncGoogle(email: string) {
  const accessToken = await getAccessToken(email);
  const metadata = await db.googleMetadata.get(email);

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
    await handleNewThreadsGoogle(accessToken, email, Array.from(newThreadIds));
  }
}

async function partialSyncOutlook(_email: string) {
  // TODO: research and implement partial sync for outlook
  // Delta tokens not applicable for mail, only calendar
}

async function loadNextPageGoogle(email: string) {
  const accessToken = await getAccessToken(email);
  const metadata = await db.googleMetadata.get(email);

  if (!metadata) {
    return;
  }

  const tList = await gThreadListNextPage(
    accessToken,
    metadata.threadsListNextPageToken
  );

  if (tList.error || !tList.data) {
    return;
  }

  const nextPageToken = tList.data.nextPageToken;
  await db.googleMetadata.update(email, {
    threadsListNextPageToken: nextPageToken,
  });

  const threadIds = tList.data.threads.map((thread) => thread.id);

  if (threadIds.length > 0) {
    await handleNewThreadsGoogle(accessToken, email, threadIds);
  }
}

// TODO: Investigate why next page token is sometimes malformed...
// e.g. https://graph.microsoft.com/v1.0/me/messages?++++++++%24select=id%2cconversationId&++++++++%24top=20&%24top=20&%24skip=20
async function loadNextPageOutlook(email: string) {
  // const accessToken = await getAccessToken(email);
  // const metadata = await db.outlookMetadata.get(email);
  // if (!metadata || !metadata.threadsListNextPageToken) {
  //   return;
  // }
  // const tList = await mThreadListNextPage(
  //   accessToken,
  //   metadata.threadsListNextPageToken
  // );
  // if (tList.error || !tList.data) {
  //   return;
  // }
  // const nextPageToken = tList.data.nextPageToken;
  // await db.outlookMetadata.update(email, {
  //   threadsListNextPageToken: nextPageToken,
  // });
  // const threadIds = _.uniq(tList.data.value.map((thread) => thread.conversationId));
  // if (threadIds.length > 0) {
  //   await handleNewThreadsOutlook(accessToken, email, threadIds);
  // }
}

export async function fullSync(email: string, provider: "google" | "outlook") {
  if (provider === "google") {
    await fullSyncGoogle(email);
  } else if (provider === "outlook") {
    await fullSyncOutlook(email);
  }
}

export async function partialSync(
  email: string,
  provider: "google" | "outlook"
) {
  if (provider === "google") {
    await partialSyncGoogle(email);
  } else if (provider === "outlook") {
    await partialSyncOutlook(email);
  }
}

export async function loadNextPage(
  email: string,
  provider: "google" | "outlook"
) {
  if (provider === "google") {
    await loadNextPageGoogle(email);
  } else if (provider === "outlook") {
    await loadNextPageOutlook(email);
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
