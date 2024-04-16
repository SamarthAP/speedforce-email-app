// Executes a 'instantaneous' client side for instant feedback, then executes an asynchronous action.
// If the asynchronous action fails, the instantaneous action is rolled back.

import toast from "react-hot-toast";
import { FOLDER_IDS } from "../api/constants";
import { IEmailThread, db } from "./db";
import { archiveThread, starThread, unstarThread } from "./sync";
import { updateLabelIdsForEmailThread } from "./util";
import _ from "lodash";
import { DraftReplyType, DraftStatusType } from "../api/model/users.draft";
import { v4 as uuidv4 } from "uuid";
import { createDraft, updateDraft, updateDraftStatus } from "../api/drafts";
import { dLog } from "./noProd";

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

      return -1;
    }

    return 0;
  } catch (e) {
    // If asyncEffectFnc throws an error, rollback
    if (rollbackFnc.constructor.name === "AsyncFunction") {
      await rollbackFnc();
    } else {
      rollbackFnc();
    }

    return -1;
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

export async function handleCreateDraft(
  email: string,
  provider: "google" | "outlook",
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  html: string,
  threadId: string | null,
  replyType: DraftReplyType,
  inReplyTo: string | null
) {
  const newDraftId = uuidv4();

  const status = await executeInstantAsyncAction(
    async () =>
      await db.drafts.put({
        id: newDraftId,
        email,
        provider,
        to: to.join(","),
        cc: cc.join(","),
        bcc: bcc.join(","),
        subject,
        html,
        date: Math.floor(new Date().getTime() / 1000),
        threadId,
        replyType,
        inReplyTo,
      }),
    async () =>
      await createDraft(
        email,
        provider,
        newDraftId,
        to.join(","),
        cc.join(","),
        bcc.join(","),
        subject,
        html,
        threadId,
        replyType,
        inReplyTo
      ),
    async () => await db.drafts.delete(newDraftId)
  );

  if (status === -1) {
    dLog("Unable to create draft");
    return { data: null, error: "Unable to create draft" };
  }

  return { data: newDraftId, error: null };
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
  const draft = await db.drafts.get(draftId);
  if (!draft) {
    return { data: null, error: "Draft not found" };
  }

  const status = await executeInstantAsyncAction(
    async () =>
      await db.drafts.update(draftId, {
        to: to.join(","),
        cc: cc.join(","),
        bcc: bcc.join(","),
        subject,
        html,
        date: Math.floor(new Date().getTime()),
      }),
    async () =>
      await updateDraft(
        email,
        provider,
        draftId,
        to.join(","),
        cc.join(","),
        bcc.join(","),
        subject,
        html
      ),
    async () => await db.drafts.update(draftId, draft)
  );

  if (status === -1) {
    dLog("Unable to update draft");
    return { data: null, error: "Unable to update draft" };
  }

  return { data: null, error: null };
}

export async function handleDiscardDraft(
  email: string,
  draftId: string,
  draftStatus: DraftStatusType
) {
  const draft = await db.drafts.get(draftId);
  if (!draft) {
    return { data: null, error: "Draft not found" };
  }

  const status = await executeInstantAsyncAction(
    async () => await db.drafts.delete(draftId),
    async () => await updateDraftStatus(email, draftId, draftStatus),
    async () => await db.drafts.put(draft)
  );

  if (status === -1) {
    dLog("Unable to create draft");
    return { data: null, error: "Unable to create draft" };
  }

  return { data: null, error: null };
}
