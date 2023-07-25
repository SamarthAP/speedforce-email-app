import {
  get as gThreadGet,
  list as gThreadList,
  listNextPage as gThreadListNextPage,
} from "../api/gmail/users/threads";
import { list as gHistoryList } from "../api/gmail/users/history";

import {
  list as mThreadList,
  listNextPage as mThreadListNextPage
} from "../api/outlook/users/threads";

import { getAccessToken } from "../api/accessToken";
import { IEmailThread, IGoogleMessage, db } from "./db";
import { getGoogleMessageHeader as getHeader } from "./util";

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
    const parsedThreads: IEmailThread[] = [];
    const parsedMessages: IGoogleMessage[] = [];

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

        message.payload.parts.forEach((part) => {
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

        parsedMessages.push({
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          from: getHeader(message.payload.headers, "From"),
          to: getHeader(message.payload.headers, "To"),
          snippet: message.snippet || "",
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
    await db.googleMessages.bulkPut(parsedMessages);

    return;
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
    await handleNewThreads(accessToken, email, threadIds);
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

  const nextPageToken = tList.data["@odata.nextLink"];
  await db.outlookMetadata.update(email, {
    threadsListNextPageToken: nextPageToken,
  });

  let parsedThreads = tList.data.value.map((thread: any) => {
    return {
      id: thread.id,
      historyId: "yuh",
      email: email,
      from: thread.sender.emailAddress.address,
      subject: thread.subject,
      snippet: thread.bodyPreview,
      date: new Date(thread.receivedDateTime).getTime(),
      unread: !thread.isRead,
    }
  })

  await db.emailThreads.bulkPut(parsedThreads);
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
    await handleNewThreads(accessToken, email, Array.from(newThreadIds));
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
    await handleNewThreads(accessToken, email, threadIds);
  }
}

async function loadNextPageOutlook(email: string) {
  const accessToken = await getAccessToken(email);
  const metadata = await db.outlookMetadata.get(email);

  if (!metadata || !metadata.threadsListNextPageToken) {
    return;
  }

  const tList = await mThreadListNextPage(
    accessToken,
    metadata.threadsListNextPageToken
  );

  if (tList.error || !tList.data) {
    return;
  }

  const nextPageToken = tList.data["@odata.nextLink"];
  await db.outlookMetadata.update(email, {
    threadsListNextPageToken: nextPageToken,
  });

  let parsedThreads = tList.data.value.map((thread: any) => {
    return {
      id: thread.id,
      historyId: "yuh",
      email: email,
      from: thread.sender.emailAddress.address,
      subject: thread.subject,
      snippet: thread.bodyPreview,
      date: new Date(thread.receivedDateTime).getTime(),
      unread: !thread.isRead,
    }
  })

  await db.emailThreads.bulkPut(parsedThreads);
}

export async function fullSync(email: string, provider: 'google' | 'outlook') {
  if (provider === 'google') {
    await fullSyncGoogle(email);
  } else if (provider === 'outlook') {
    await fullSyncOutlook(email);
  }
}

export async function partialSync(email: string, provider: 'google' | 'outlook') {
  if (provider === 'google') {
    await partialSyncGoogle(email);
  } else if (provider === 'outlook') {
    await partialSyncOutlook(email);
  }
}

export async function loadNextPage(email: string, provider: 'google' | 'outlook') {
  if (provider === 'google') {
    await loadNextPageGoogle(email);
  } else if (provider === 'outlook') {
    await loadNextPageOutlook(email);
  }
}