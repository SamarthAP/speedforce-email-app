import UnreadDot from "./UnreadDot";
import { IEmailThread, ISelectedEmail, db } from "../lib/db";
import he from "he";
import React, { useState } from "react";
import {
  archiveThread,
  markRead,
  starThread,
  unstarThread,
  trashThread,
  deleteThread,
} from "../lib/sync";
import {
  CheckCircleIcon,
  StarIcon as StarIconSolid,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { HorizontalAttachments } from "./HorizontalAttachments";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { executeInstantAsyncAction } from "../lib/asyncHelpers";
import {
  addDexieThread,
  deleteDexieThread,
  updateLabelIdsForEmailThread,
} from "../lib/util";
import { FOLDER_IDS } from "../api/constants";
import _ from "lodash";
import { ConfirmModal } from "./modals/ConfirmModal";
import { useNavigate } from "react-router-dom";
import ThreadSummaryHoverCard from "./ThreadSummaryHoverCard";
import { useLiveQuery } from "dexie-react-hooks";

function isToday(date: Date) {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isLastSevenDaysButNotToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return date < today && date >= sevenDaysAgo;
}

function isOlderThanSevenDays(date: Date) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return date < sevenDaysAgo;
}

interface DeleteThreadModalData {
  isDialogOpen: boolean;
  thread: IEmailThread | null;
}

interface ThreadListProps {
  selectedEmail: ISelectedEmail;
  threads?: IEmailThread[]; // TODO: change for outlook thread
  setHoveredThread: (thread: IEmailThread | null) => void;
  setScrollPosition: (position: number) => void;
  handleScroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  canArchiveThread?: boolean;
  canTrashThread?: boolean;
  canPermanentlyDeleteThread?: boolean;
  isDrafts?: boolean;
}

export default function ThreadList({
  selectedEmail,
  threads,
  setHoveredThread,
  setScrollPosition,
  handleScroll,
  scrollRef,
  canArchiveThread = false,
  canTrashThread = false,
  canPermanentlyDeleteThread = false,
  isDrafts = false,
}: ThreadListProps) {
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();

  const [deleteThreadModalData, setDeleteThreadModalData] =
    useState<DeleteThreadModalData>({
      isDialogOpen: false,
      thread: null,
    });

  async function handleDeletePermanentlyClick(thread: IEmailThread | null) {
    if (!thread) {
      return;
    }

    await executeInstantAsyncAction(
      () => void deleteDexieThread(thread.id),
      async () =>
        await deleteThread(
          selectedEmail.email,
          selectedEmail.provider,
          thread.id
        ),
      () => void addDexieThread(thread)
    );
  }

  return (
    <div
      onScroll={handleScroll}
      ref={scrollRef}
      className="h-full flex flex-col overflow-y-scroll hide-scroll"
    >
      {threads?.map((thread, index) => {
        return (
          <div
            // onClick={() => {
            //   setScrollPosition(scrollRef.current?.scrollTop || 0);
            //   setSelectedThread(thread.id);
            //   if (thread.unread) {
            //     void markRead(
            //       selectedEmail.email,
            //       selectedEmail.provider,
            //       thread.id
            //     );
            //   }
            // }}
            // onMouseOver={() => setHoveredThread(thread)}
            key={index}
          >
            {index === 0 && isToday(new Date(thread.date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 mb-2">
                Today
              </div>
            ) : null}

            {index === 0 &&
            isLastSevenDaysButNotToday(new Date(thread.date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 mb-2">
                Last 7 days
              </div>
            ) : null}

            {index > 0 &&
            isLastSevenDaysButNotToday(new Date(thread.date)) &&
            isToday(new Date(threads[index - 1].date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 my-2">
                Last 7 days
              </div>
            ) : null}

            {index === 0 && isOlderThanSevenDays(new Date(thread.date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 mb-2">
                Past Month And Older
              </div>
            ) : null}

            {index > 0 &&
            isOlderThanSevenDays(new Date(thread.date)) &&
            isLastSevenDaysButNotToday(new Date(threads[index - 1].date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 my-2">
                Past Month And Older
              </div>
            ) : null}

            <ThreadListRow
              thread={thread}
              selectedEmail={selectedEmail}
              canArchiveThread={canArchiveThread}
              canTrashThread={canTrashThread}
              canPermanentlyDeleteThread={canPermanentlyDeleteThread}
              isDrafts={isDrafts}
              setHoveredThread={setHoveredThread}
              setDeleteThreadModalData={setDeleteThreadModalData}
              handleShowTooltip={handleShowTooltip}
              handleHideTooltip={handleHideTooltip}
            />
          </div>
        );
      })}
      {/* <div
        className="text-center text-xs text-slate-400 dark:text-zinc-500 h-[33px]"
        ref={observerTarget}
      ></div> */}
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
      <ConfirmModal
        dialogTitle="Delete This Forever?"
        dialogMessage="Are you sure you want to permanently delete this thread? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonAction={() =>
          void handleDeletePermanentlyClick(deleteThreadModalData.thread)
        }
        isDialogOpen={deleteThreadModalData.isDialogOpen}
        setIsDialogOpen={() =>
          setDeleteThreadModalData({
            ...deleteThreadModalData,
            isDialogOpen: false,
          })
        }
      />
    </div>
  );
}

interface ThreadListRowProps {
  thread: IEmailThread;
  selectedEmail: ISelectedEmail;
  canArchiveThread: boolean;
  canTrashThread: boolean;
  canPermanentlyDeleteThread: boolean;
  isDrafts: boolean;
  setHoveredThread: (thread: IEmailThread | null) => void;
  setDeleteThreadModalData: (data: DeleteThreadModalData) => void;
  handleShowTooltip: (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => void;
  handleHideTooltip: () => void;
}

function ThreadListRow({
  thread,
  selectedEmail,
  canArchiveThread,
  canTrashThread,
  canPermanentlyDeleteThread,
  isDrafts,
  setHoveredThread,
  setDeleteThreadModalData,
  handleShowTooltip,
  handleHideTooltip,
}: ThreadListRowProps) {
  const navigate = useNavigate();
  const [showSummaryCard, setShowSummaryCard] = useState(false);

  function handleThreadClick(thread: IEmailThread) {
    // setScrollPosition(scrollRef.current?.scrollTop || 0);
    if (isDrafts) {
      navigate(`/draft/${thread.id}`);
    } else {
      if (thread.unread) {
        void markRead(selectedEmail.email, selectedEmail.provider, thread.id);
      }

      navigate(`/thread/${thread.id}`);
    }
  }

  async function handleStarClick(thread: IEmailThread) {
    if (thread.labelIds.includes("STARRED")) {
      await executeInstantAsyncAction(
        () => void updateLabelIdsForEmailThread(thread.id, [], ["STARRED"]),
        async () =>
          await unstarThread(
            selectedEmail.email,
            selectedEmail.provider,
            thread.id
          ),
        () => {
          void updateLabelIdsForEmailThread(thread.id, ["STARRED"], []);
          toast("Unable to unstar thread");
        }
      );
    } else {
      await executeInstantAsyncAction(
        () => void updateLabelIdsForEmailThread(thread.id, ["STARRED"], []),
        async () =>
          await starThread(
            selectedEmail.email,
            selectedEmail.provider,
            thread.id
          ),
        () => {
          void updateLabelIdsForEmailThread(thread.id, [], ["STARRED"]);
          toast("Unable to star thread");
        }
      );
    }
  }

  async function handleArchiveClick(thread: IEmailThread) {
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
      async () =>
        await archiveThread(
          selectedEmail.email,
          selectedEmail.provider,
          thread.id
        ),
      () => {
        void updateLabelIdsForEmailThread(thread.id, labelsToRemove, [
          FOLDER_IDS.DONE,
        ]);
        toast("Unable to archive thread");
      }
    );
  }

  async function handleTrashClick(thread: IEmailThread) {
    const labelsToRemove = _.intersection(thread.labelIds, [
      FOLDER_IDS.INBOX,
      FOLDER_IDS.SENT,
    ]);

    await executeInstantAsyncAction(
      () =>
        void updateLabelIdsForEmailThread(
          thread.id,
          [FOLDER_IDS.TRASH],
          labelsToRemove
        ),
      async () =>
        await trashThread(
          selectedEmail.email,
          selectedEmail.provider,
          thread.id
        ),
      () => {
        void updateLabelIdsForEmailThread(thread.id, labelsToRemove, [
          FOLDER_IDS.TRASH,
        ]);
        toast("Unable to trash thread");
      }
    );
  }

  const message = useLiveQuery(() => {
    return db.messages.where("threadId").equals(thread.id).first();
  });

  return (
    <>
      <div
        onClick={() => handleThreadClick(thread)}
        onMouseOver={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          setHoveredThread(thread);
          setShowSummaryCard(true);
        }}
        onMouseLeave={() => {
          setShowSummaryCard(false);
        }}
        className="relative grid grid-cols-10 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-default group"
      >
        <div className="text-sm flex items-center font-medium pr-4 col-span-2">
          <div className="flex flex-col items-center justify-center px-2">
            {thread.labelIds.includes("STARRED") ? (
              <button
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Unstar");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={(
                  event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  event.stopPropagation();
                  void handleStarClick(thread);
                }}
              >
                <StarIconSolid className="w-4 h-4 text-yellow-400" />
              </button>
            ) : (
              <button
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Star");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={(
                  event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  event.stopPropagation();
                  void handleStarClick(thread);
                }}
              >
                <StarIconOutline className="w-4 h-4 text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100" />
              </button>
            )}
          </div>
          <div className="pr-2">
            {thread.unread ? (
              <UnreadDot />
            ) : (
              <div className="h-[6px] w-[6px]"></div>
            )}
          </div>

          <span className="truncate text-black dark:text-zinc-100">
            {
              // TODO: Should we make a DraftThreadView or DraftThreadList component to avoid need for live query?
              isDrafts
                ? message?.toRecipients
                    .map((recipient) =>
                      recipient.slice(0, recipient.lastIndexOf("<"))
                    )
                    .join(", ")
                : thread.from.slice(0, thread.from.lastIndexOf("<"))
            }
          </span>
        </div>
        <div className="col-span-8 flex overflow-hidden">
          <div className="flex max-w-[50%]">
            <div className="text-sm truncate pr-4 col-span-2 text-black dark:text-zinc-100">
              {thread.subject || "(no subject)"}
            </div>
          </div>

          <div className="flex flex-grow overflow-hidden">
            <div className="text-sm truncate text-slate-400 dark:text-zinc-500 w-full">
              {he.decode(thread.snippet)}
            </div>
            <div className="text-sm pl-2 pr-4 flex-shrink-0 text-slate-400 dark:text-zinc-500 font-medium flex flex-col justify-center">
              <span className="group-hover:hidden block">
                {isToday(new Date(thread.date))
                  ? new Date(thread.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date(thread.date).toDateString()}
              </span>

              <span className="flex flex-row">
                {canArchiveThread && (
                  <button
                    onMouseEnter={(event) => {
                      handleShowTooltip(event, "Mark as done");
                    }}
                    onMouseLeave={handleHideTooltip}
                    onClick={(
                      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ) => {
                      event.stopPropagation();
                      void handleArchiveClick(thread);
                    }}
                    className="group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
                  >
                    <CheckCircleIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 " />
                  </button>
                )}
                {canTrashThread && (
                  <button
                    onMouseEnter={(event) => {
                      handleShowTooltip(
                        event,
                        isDrafts ? "Discard Draft" : "Delete"
                      );
                    }}
                    onMouseLeave={handleHideTooltip}
                    onClick={(
                      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ) => {
                      event.stopPropagation();
                      void handleTrashClick(thread);
                    }}
                    className="ml-1 group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
                  >
                    <TrashIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 " />
                  </button>
                )}
                {canPermanentlyDeleteThread && (
                  <button
                    onMouseEnter={(event) => {
                      handleShowTooltip(event, "Permanently Delete");
                    }}
                    onMouseLeave={handleHideTooltip}
                    onClick={(
                      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ) => {
                      event.stopPropagation();
                      setDeleteThreadModalData({
                        isDialogOpen: true,
                        thread: thread,
                      });
                    }}
                    className="ml-1 group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
                  >
                    <TrashIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 " />
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
        <HorizontalAttachments thread={thread} selectedEmail={selectedEmail} />
      </div>
      {/* need to render card and unrender it like this to reset the timeout. if we instead pass a "show" prop, then the timeout will not reset (i think) */}
      {showSummaryCard && (
        <ThreadSummaryHoverCard
          threadId={thread.id}
          threadSubject={thread.subject}
        />
      )}
    </>
  );
}
