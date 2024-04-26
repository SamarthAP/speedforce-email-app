import UnreadDot from "./UnreadDot";
import { IEmailThread, ISelectedEmail, db } from "../lib/db";
import he from "he";
import React, { useEffect, useRef, useState } from "react";
import {
  archiveThread,
  markRead,
  starThread,
  unstarThread,
  trashThread,
  deleteThread,
  deleteDraft,
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
import {
  executeInstantAsyncAction,
  handleTrashThread,
} from "../lib/asyncHelpers";
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
import { useHoveredThreadContext } from "../contexts/HoveredThreadContext";
import { useDisableMouseHoverContext } from "../contexts/DisableMouseHoverContext";
import ConvertToActionItem from "./ConvertToActionItem";
import { getJWTHeaders } from "../api/authHeader";
import { dLog } from "../lib/noProd";

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
  threads?: IEmailThread[];
  setScrollPosition: (position: number) => void;
  handleScroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  canArchiveThread?: boolean;
  canTrashThread?: boolean;
  canPermanentlyDeleteThread?: boolean;
  canConvertToActionItem?: boolean;
  isDrafts?: boolean;
  navigateToFeed?: string;
}

export default function ThreadList({
  selectedEmail,
  threads,
  setScrollPosition,
  handleScroll,
  scrollRef,
  canArchiveThread = false,
  canTrashThread = false,
  canPermanentlyDeleteThread = false,
  canConvertToActionItem = false,
  isDrafts = false,
  navigateToFeed,
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
            onClick={() => {
              setScrollPosition(scrollRef.current?.scrollTop || 0);
              if (thread.unread) {
                void markRead(
                  selectedEmail.email,
                  selectedEmail.provider,
                  thread.id
                );
              }
            }}
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

            {index === 0 && isOlderThanSevenDays(new Date(thread.date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 mb-2">
                Past Month And Older
              </div>
            ) : null}

            {index > 0 &&
            isLastSevenDaysButNotToday(new Date(thread.date)) &&
            isToday(new Date(threads[index - 1].date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 my-2">
                Last 7 days
              </div>
            ) : null}

            {index > 0 &&
            isOlderThanSevenDays(new Date(thread.date)) &&
            isToday(new Date(threads[index - 1].date)) ? (
              <div className="pl-8 text-sm text-slate-400 dark:text-zinc-500 my-2">
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
              threadIndex={index}
              selectedEmail={selectedEmail}
              canArchiveThread={canArchiveThread}
              canTrashThread={canTrashThread}
              canPermanentlyDeleteThread={canPermanentlyDeleteThread}
              canConvertToActionItem={canConvertToActionItem}
              isDrafts={isDrafts}
              setDeleteThreadModalData={setDeleteThreadModalData}
              handleShowTooltip={handleShowTooltip}
              handleHideTooltip={handleHideTooltip}
              navigateToFeed={navigateToFeed}
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
  threadIndex: number;
  selectedEmail: ISelectedEmail;
  canArchiveThread: boolean;
  canTrashThread: boolean;
  canPermanentlyDeleteThread: boolean;
  canConvertToActionItem: boolean;
  isDrafts: boolean;
  setDeleteThreadModalData: (data: DeleteThreadModalData) => void;
  handleShowTooltip: (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => void;
  handleHideTooltip: () => void;
  navigateToFeed?: string;
}

function ThreadListRow({
  thread,
  threadIndex,
  selectedEmail,
  canArchiveThread,
  canTrashThread,
  canPermanentlyDeleteThread,
  canConvertToActionItem,
  isDrafts,
  setDeleteThreadModalData,
  handleShowTooltip,
  handleHideTooltip,
  navigateToFeed,
}: ThreadListRowProps) {
  const navigate = useNavigate();
  const itemRef = useRef<HTMLDivElement>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const hoveredThreadContext = useHoveredThreadContext();
  const disableMouseHoverContext = useDisableMouseHoverContext();
  const isHovered = hoveredThreadContext.threadIndex === threadIndex;

  useEffect(() => {
    if (isHovered && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth", // smooth or instant
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [isHovered]);

  function handleThreadClick(thread: IEmailThread) {
    // setScrollPosition(scrollRef.current?.scrollTop || 0);
    if (isDrafts) {
      navigate(`/draft/${thread.id}`);
    } else {
      if (thread.unread) {
        void markRead(selectedEmail.email, selectedEmail.provider, thread.id);
      }

      if (navigateToFeed) {
        navigate(`${navigateToFeed}/${hoveredThreadContext.threadIndex}`);
      } else {
        navigate(`/thread/${thread.id}`);
      }
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
    await handleTrashThread(
      selectedEmail.email,
      selectedEmail.provider,
      thread
    );
  }

  useEffect(() => {
    const abortController = new AbortController();
    if (canConvertToActionItem) {
      if (!thread.actionItemGenerated) {
        getJWTHeaders()
          .then((authHeader) => {
            const response = fetch(
              "https://ai-service.speedforce.me/convertToActionItem",
              {
                signal: abortController.signal,
                method: "POST",
                headers: {
                  ...authHeader,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  thread_id: thread.id,
                  email: selectedEmail.email,
                  provider: selectedEmail.provider,
                }),
              }
            );

            response
              .then((response) => {
                if (response.ok) {
                  void response.json().then((data) => {
                    void db.emailThreads
                      .update(thread.id, {
                        actionItemGenerated: true,
                        actionItemString: data.action_item || "",
                      })
                      .then(() => {
                        dLog("thread updated");
                      })
                      .catch((error) => {
                        dLog("Failed to update thread", error);
                      });
                  });
                } else {
                  throw new Error("Failed to convert email to action item");
                }
              })
              .catch((error) => {
                dLog("Failed to convert email to action item", error);
              });
          })
          .catch((error) => {
            dLog("Failed to get auth headers", error);
          });
      }
    }

    return () => {
      abortController.abort();
    };
  }, [
    canConvertToActionItem,
    selectedEmail.email,
    selectedEmail.provider,
    thread.actionItemGenerated,
    thread.id,
  ]);

  const message = useLiveQuery(() => {
    return db.messages.where("threadId").equals(thread.id).first();
  });

  return (
    <div ref={itemRef} className="relative">
      <div
        onClick={() => handleThreadClick(thread)}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (!disableMouseHoverContext.disableMouseHover) {
            hoveredThreadContext.setThreadIndex(threadIndex);
            setShowSummaryCard(true);
          }
        }}
        onMouseLeave={() => {
          setShowSummaryCard(false);
        }}
        className={`relative grid grid-cols-10 py-1 cursor-default group ${
          hoveredThreadContext.threadIndex === threadIndex
            ? "bg-slate-100 dark:bg-zinc-800"
            : ""
        }`}
      >
        <div className="text-sm flex items-center font-medium pr-4 col-span-2 gap-x-2 pl-2">
          <div className="flex flex-col items-center justify-center">
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
          {/* this is so that we don't get an extra space (due to the empty div) on all other pages that dont have action item conversion */}
          {canConvertToActionItem ? (
            thread.actionItemGenerated &&
            thread.actionItemString &&
            thread.actionItemString.toLowerCase() !== "none" ? (
              <ConvertToActionItem
                thread={thread}
                email={selectedEmail.email}
                provider={selectedEmail.provider}
                handleShowTooltip={handleShowTooltip}
                handleHideTooltip={handleHideTooltip}
              />
            ) : (
              <div className="w-4 h-4 shrink-0"></div>
            )
          ) : null}
          <div className="">
            {thread.unread ? (
              <UnreadDot />
            ) : (
              <div className="h-[6px] w-[6px]"></div>
            )}
          </div>
          <span className="truncate text-black dark:text-zinc-100">
            {
              // TODO: Should we make a DraftThreadView or DraftThreadList component to avoid need for live query?
              (isDrafts
                ? message?.toRecipients
                    .map((recipient) =>
                      recipient.slice(0, recipient.lastIndexOf("<"))
                    )
                    .join(", ")
                : thread.from.slice(0, thread.from.lastIndexOf("<"))) ||
                "(no sender)"
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
              {/* 
                NOTE: Some emails append &zwnj; to the snippet (at least on Gmail, idk about Outlook). This is called a Zero Width Non-Joiner.
                It has the same effect as a space character. You can see it inside the HTML as &zwnj;, but when you console log it, it just shows up as spaces.
                This causes the truncate dots (...) to come up on the thread row, because the spaces make it truncate.
                You cannot .replace(/&zwnj;/g, "") to remove the &zwnj; from the snippet, because you actually need to use the unicode character (U+200C) to remove it.
              */}
              {he
                .decode(thread.snippet)
                .replace(/\u200C/g, "")
                .trim()}
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

              <span className="flex flex-row gap-x-1">
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
                    className="group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
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
                    className="group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
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
    </div>
  );
}
