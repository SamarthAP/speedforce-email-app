// Executes a 'instantaneous' client side for instant feedback, then executes an asynchronous action.
// If the asynchronous action fails, the instantaneous action is rolled back.

import toast from "react-hot-toast";
import { FOLDER_IDS } from "../api/constants";
import { IEmailThread, db } from "./db";
import {
  archiveThread,
  deleteDraft,
  starThread,
  trashThread,
  unstarThread,
  updateDraft,
  updateDraftForReply,
} from "./sync";
import {
  getSnippetFromHtml,
  updateDexieDraft,
  updateLabelIdsForEmailThread,
} from "./util";
import _ from "lodash";
import { updateSharedDraftStatus } from "../api/sharedDrafts";
import { SharedDraftStatusType } from "../api/model/users.shared.draft";

// Usage: instantEffectFnc, rollbackFnc can be async, but the intent is that they execute much quicker (e.g. dexie operations)
export const executeInstantAsyncAction = async (
  instantEffectFnc: (...args: any[]) => any,
  asyncEffectFnc: (...args: any[]) => Promise<any>,
  rollbackFnc: (...args: any[]) => any
) => {
  // Any use for the result of instantEffect?
  let instantEffectResult: any = null;
  if (instantEffectFnc.constructor.name === "AsyncFunction") {
    instantEffectResult = await instantEffectFnc();
  } else {
    instantEffectResult = instantEffectFnc();
  }

  try {
    const asyncEffectResult = await asyncEffectFnc();

    // If error property of result is non-null, rollback
    if (asyncEffectResult && asyncEffectResult.error) {
      if (rollbackFnc.constructor.name === "AsyncFunction") {
        await rollbackFnc();
      } else {
        rollbackFnc();
      }
    }
  } catch (e) {
    // If asyncEffectFnc throws an error, rollback
    if (rollbackFnc.constructor.name === "AsyncFunction") {
      await rollbackFnc();
    } else {
      rollbackFnc();
    }
  }
};

export async function handleArchiveClick(
  thread: IEmailThread,
  email: string,
  provider: "google" | "outlook"
) {
  const labelsToRemove = _.intersection(thread.labelIds, [
    FOLDER_IDS.INBOX,
    FOLDER_IDS.SENT,
  ]);

  await executeInstantAsyncAction(
    () =>
      void updateLabelIdsForEmailThread(
        thread.id,
        [FOLDER_IDS.DONE],
        labelsToRemove
      ),
    async () => await archiveThread(email, provider, thread.id),
    () => {
      void updateLabelIdsForEmailThread(thread.id, labelsToRemove, [
        FOLDER_IDS.DONE,
      ]);
      toast("Unable to archive thread");
    }
  );
}

export async function handleStarClick(
  thread: IEmailThread,
  email: string,
  provider: "google" | "outlook"
) {
  if (thread.labelIds.includes("STARRED")) {
    await executeInstantAsyncAction(
      () => void updateLabelIdsForEmailThread(thread.id, [], ["STARRED"]),
      async () => await unstarThread(email, provider, thread.id),
      () => {
        void updateLabelIdsForEmailThread(thread.id, ["STARRED"], []);
        toast("Unable to unstar thread");
      }
    );
  } else {
    await executeInstantAsyncAction(
      () => void updateLabelIdsForEmailThread(thread.id, ["STARRED"], []),
      async () => await starThread(email, provider, thread.id),
      () => {
        void updateLabelIdsForEmailThread(thread.id, [], ["STARRED"]);
        toast("Unable to star thread");
      }
    );
  }
}

export async function handleUpdateDraft(
  email: string,
  provider: "google" | "outlook",
  draftId: string,
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  html: string
) {
  const draft = await db.drafts.get({ id: draftId });
  if (!draft) return;

  const thread = await db.emailThreads.get({ id: draft.threadId });
  const message = (await db.messages.get({ draftId: draftId })) || null;

  if (!thread || !message) return;

  // need to do this bc electron forge compiler complains that thread and message could be null
  const nonNullThread = thread;
  const nonNullMessage = message;

  const newSnippet = await getSnippetFromHtml(html);
  await executeInstantAsyncAction(
    () => {
      void updateDexieDraft(
        {
          ...nonNullThread,
          subject,
          snippet: newSnippet,
          date: new Date().getTime(),
        },
        {
          ...nonNullMessage,
          toRecipients: to,
          ccRecipients: cc,
          bccRecipients: bcc,
          htmlData: html,
        }
      );
    },
    async () =>
      await updateDraft(email, provider, draftId, to, cc, bcc, subject, html),
    () => {
      void updateDexieDraft(nonNullThread, nonNullMessage);
    }
  );
}

export async function handleUpdateDraftForReply(
  email: string,
  provider: "google" | "outlook",
  draftId: string,
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  html: string,
  headerMessageId: string,
  threadId: string,
  messageId: string
) {
  const draft = await db.drafts.get({ id: draftId });
  if (!draft) return;

  const thread = await db.emailThreads.get({ id: draft.threadId });
  const message = (await db.messages.get({ draftId: draftId })) || null;

  if (!thread || !message) return;

  // need to do this bc electron forge compiler complains that thread and message could be null
  const nonNullThread = thread;
  const nonNullMessage = message;

  await executeInstantAsyncAction(
    () => {
      void updateDexieDraft(
        {
          ...nonNullThread,
          date: new Date().getTime(),
        },
        {
          ...nonNullMessage,
          toRecipients: to,
          ccRecipients: cc,
          bccRecipients: bcc,
          htmlData: html,
        }
      );
    },
    async () =>
      await updateDraftForReply(
        email,
        provider,
        draftId,
        to,
        cc,
        bcc,
        subject,
        html,
        headerMessageId,
        threadId,
        messageId
      ),
    () => {
      void updateDexieDraft(nonNullThread, nonNullMessage);
    }
  );
}

export async function handleDiscardDraft(
  email: string,
  provider: "google" | "outlook",
  draftId: string
) {
  const draft = await db.drafts.get({ id: draftId });
  if (!draft) return;

  const thread = await db.emailThreads.get({ id: draft.threadId });
  const message =
    (await db.messages.where("draftId").equals(draftId).first()) || null;
  if (!thread || !message) return;

  await executeInstantAsyncAction(
    async () => {
      if (!draft) return;

      await db.drafts.delete(draftId);
      await db.emailThreads.delete(thread.id);
      await db.messages.delete(message.id);
    },
    async () => {
      await deleteDraft(email, provider, draftId, true);

      // Mark the shared draft as discarded so that the other user can't see it
      await updateSharedDraftStatus(
        thread.id,
        email,
        SharedDraftStatusType.DISCARDED
      );
    },
    async () => {
      await db.drafts.put(draft);
      await db.emailThreads.put(thread);
      await db.messages.put(message);
    }
  );
}

// Trash a thread thats not a draft
export async function handleTrashThread(
  email: string,
  provider: "google" | "outlook",
  thread: IEmailThread
) {
  const labelsToRemove = _.intersection(thread.labelIds, [
    FOLDER_IDS.INBOX,
    FOLDER_IDS.SENT,
  ]);

  const drafts = await db.drafts.where("threadId").equals(thread.id).toArray();
  await executeInstantAsyncAction(
    async () => {
      void updateLabelIdsForEmailThread(
        thread.id,
        [FOLDER_IDS.TRASH],
        labelsToRemove
      );

      await db.drafts.bulkDelete(drafts.map((draft) => draft.id));
    },
    async () => {
      await trashThread(email, provider, thread.id);
    },
    async () => {
      void updateLabelIdsForEmailThread(thread.id, labelsToRemove, [
        FOLDER_IDS.TRASH,
      ]);

      await db.drafts.bulkAdd(drafts);
      toast("Unable to trash thread");
    }
  );
}

// export async function handleSendMessage(
//   email: string,
//   provider: "google" | "outlook",
//   draftId: string,
//   to: string[],
//   cc: string[],
//   bcc: string[],
//   subject: string,
//   html: string,
//   attachments: NewAttachment[] = []
// ) {
//   await executeInstantAsyncAction(
//     () => {

//     },
//     async () =>
//       await updateDraft(email, provider, threadId, to, cc, bcc, subject, html),
//     () => void toast("Unable to send message")
//   );
// }
