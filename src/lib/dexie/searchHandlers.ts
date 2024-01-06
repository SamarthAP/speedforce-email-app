import { IEmailThread, IMessage, ISelectedEmail } from "../db";
import { getFolderIdFromSearchFolder } from "../util";

// Handler for the "in" search operator (e.g. "in:inbox")
export function inActionHandler(
  queryValue: string,
  thread: IEmailThread,
  selectedEmail: ISelectedEmail
) {
  if (queryValue === "starred") {
    return thread.labelIds?.includes("STARRED") || false;
  } else {
    const labelId = getFolderIdFromSearchFolder(
      selectedEmail.provider,
      queryValue
    );

    return (
      thread.labelIds?.includes(labelId) ||
      thread.labelIds?.includes(queryValue) ||
      false
    );
  }
}

// Handler for the "from" search operator (e.g. "from:jane")
export function fromActionHandler(
  queryValue: string,
  thread: IEmailThread,
  messages: IMessage[]
) {
  const fromThreads = messages
    .filter((message) =>
      message.from.toLocaleLowerCase().includes(queryValue.toLocaleLowerCase())
    )
    .map((message) => message.threadId);

  return fromThreads?.includes(thread.id);
}

// Handler for the "to" search operator (e.g. "to:james")
export function toActionHandler(
  queryValue: string,
  thread: IEmailThread,
  messages: IMessage[]
) {
  const toThreads = messages
    .filter(
      (message) =>
        message.toRecipients.findIndex((toRecipient) =>
          toRecipient
            .toLocaleLowerCase()
            .includes(queryValue.toLocaleLowerCase())
        ) !== -1
    )
    .map((message) => message.threadId);

  return toThreads?.includes(thread.id);
}

// Handler for a generic search (e.g. "hello")
export function genericSearchHandler(
  queryValue: string,
  thread: IEmailThread,
  messages: IMessage[]
) {
  const threadIds = messages
    .filter((message) =>
      message.htmlData.includes(queryValue.toLocaleLowerCase())
    )
    .map((message) => message.threadId);

  return (
    threadIds?.includes(thread.id) ||
    thread.from.toLocaleLowerCase().includes(queryValue.toLocaleLowerCase()) ||
    thread.subject.toLocaleLowerCase().includes(queryValue.toLocaleLowerCase())
  );
}
