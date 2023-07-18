import {
  get as gThreadGet,
  list as gThreadList,
  listNextPage as gThreadListNextPage,
} from "../api/gmail/users/threads";
import { list as gHistoryList } from "../api/gmail/users/history";

import { getAccessToken } from "../api/accessToken";
import { IGoogleThread, db } from "./db";

async function handleNewThreads(
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
    const parsedThreads: IGoogleThread[] = [];

    threads.forEach((thread) => {
      if (parseInt(thread.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(thread.historyId);
      }

      const lastMessageIndex = thread.messages.length - 1;

      parsedThreads.push({
        id: thread.id,
        historyId: thread.historyId,
        email: email,
        from: thread.messages[0].payload.headers.filter(
          (header) => header.name === "From"
        )[0].value,
        subject: thread.messages[0].payload.headers.filter(
          (header) => header.name === "Subject"
        )[0].value,
        snippet: thread.messages[lastMessageIndex].snippet, // this should be the latest message's snippet
        date: new Date(
          thread.messages[0].payload.headers.filter(
            (header) => header.name === "Date"
          )[0].value
        ).getTime(),
        unread: thread.messages[lastMessageIndex].labelIds.includes("UNREAD"),
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
    await db.googleThreads.bulkPut(parsedThreads);

    // TODO: save messages and uses format=full
    return;
  } catch (e) {
    console.log("Could not sync mailbox");
    console.log(e);
    return;
  }
}

export async function fullSyncGoogle(email: string) {
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
    await handleNewThreads(accessToken, email, threadIds);
  }
}

export async function partialSyncGoogle(email: string) {
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
    await handleNewThreads(accessToken, email, Array.from(newThreadIds));
  }
}

export async function loadNextPageGoogle(email: string) {
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
    await handleNewThreads(accessToken, email, threadIds);
  }
}
