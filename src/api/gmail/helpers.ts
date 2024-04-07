import { db, IMessage } from "../../lib/db";
import { getMessageHeader, formatDateForForwardTemplate } from "../../lib/util";
import _ from "lodash";
import { list as gDraftsList } from "./users/drafts";
import { getAccessToken } from "../accessToken";
import { GoogleDraftType } from "../model/users.draft";

export function getToRecipients(message: IMessage, email: string): string[] {
  const from =
    getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g) || [];
  const to =
    getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g) || [];
  const cc =
    getMessageHeader(message.headers, "Cc").match(/[\w.-]+@[\w.-]+/g) || [];

  // Recipients can come from any of the from, to, and cc fields
  const toRecipients = _.uniq(
    _.concat(from, to, cc).map((r) => r.toLowerCase())
  );

  return toRecipients.filter((r) => r !== null && r !== email);
}

export function addTabbedMessageToForwardedHTML(
  beforeString: string,
  message: IMessage,
  afterString: string
) {
  const from =
    getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g)?.[0] ||
    "";
  const to =
    getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g)?.[0] ||
    "";
  const cc = getMessageHeader(message.headers, "Cc");
  const subject = getMessageHeader(message.headers, "Subject");
  const date = getMessageHeader(message.headers, "Date");

  if (!from || !date) {
    return { beforeString, afterString };
  }

  const formattedDate = formatDateForForwardTemplate(new Date(date));
  const htmlData = message.htmlData;

  return {
    beforeString: `${beforeString}
                <div class="speedforce_quote">
                  <div>---------- Forwarded message ---------</div>
                  <div class="testclass">From: ${from}</div>
                  <div>Date: ${formattedDate}</div>
                  <div>Subject: ${subject}</div>
                  <div>To: ${to}</div>
                  ${cc ? "<div>Cc: " + cc + "</div>" : ""}
                  <br>
                  <blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
                    <div dir="ltr">
                      ${htmlData}`,
    afterString: `
                    </div>
                  </blockquote>
                </div>
                <br><br>${afterString}`,
  };
}

export async function buildForwardedHTML(
  message: IMessage,
  newMessageHTML = ""
) {
  let beforeString = `${newMessageHTML}`;
  let afterString = "";

  ({ beforeString, afterString } = addTabbedMessageToForwardedHTML(
    beforeString,
    message,
    afterString
  ));

  return `${beforeString}${afterString}`;
}

export async function getDraftByMessageId(email: string, messageId: string) {
  const accessToken = await getAccessToken(email);

  const dexieDraft = await db.messages.where("id").equals(messageId).first();

  if (dexieDraft) {
    return dexieDraft.draftId;
  }

  const { data, error } = await gDraftsList(accessToken);
  if (error) {
    return null;
  }

  const draft = data?.drafts.find((d) => d.message?.id === messageId);
  return draft?.id || null;
}

// Update draft in Dexie after saving draft
// Thread id and message id are subject to change
export async function updateDexieDraftAfterSaving(
  draftId: string,
  newDraft: GoogleDraftType
) {
  // Validate new draft
  if (!newDraft.id || !newDraft.message?.id || !newDraft.message?.threadId)
    return;

  const existingMessage = await db.messages
    .where("draftId")
    .equals(draftId)
    .first();
  if (!existingMessage) return;

  const existingThread = await db.emailThreads
    .where("id")
    .equals(existingMessage.threadId)
    .first();
  if (!existingThread) return;

  if (
    existingMessage.id === newDraft.message.id &&
    existingMessage.threadId === newDraft.message.threadId
  )
    return;

  // Since we are modifying the primary key, we need to delete and re-insert
  await db.emailThreads.put({
    ...existingThread,
    id: newDraft.message.threadId,
  });

  await db.messages.put({
    ...existingMessage,
    id: newDraft.message.id,
    threadId: newDraft.message.threadId,
    draftId: newDraft.id,
  });

  await db.drafts.update(draftId, { threadId: newDraft.message.threadId });

  await db.emailThreads.delete(existingMessage.threadId);
  await db.messages.delete(existingMessage.id);
}
