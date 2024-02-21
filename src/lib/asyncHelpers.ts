// Executes a 'instantaneous' client side for instant feedback, then executes an asynchronous action.
// If the asynchronous action fails, the instantaneous action is rolled back.

import toast from "react-hot-toast";
import { FOLDER_IDS } from "../api/constants";
import { IEmailThread } from "./db";
import { archiveThread, starThread, unstarThread } from "./sync";
import { updateLabelIdsForEmailThread } from "./util";
import _ from "lodash";

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
