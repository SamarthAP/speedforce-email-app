import UnreadDot from "./UnreadDot";
import { IEmailThread, ISelectedEmail } from "../lib/db";
import he from "he";
import { useEffect, useRef } from "react";
import { loadNextPage, markRead, starThread, unstarThread } from "../lib/sync";
import { StarIcon as StarIconSolid } from "@heroicons/react/20/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";

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

interface ThreadListProps {
  selectedEmail: ISelectedEmail;
  threads?: IEmailThread[]; // TODO: change for outlook thread
  setSelectedThread: (threadId: string) => void;
  setHoveredThread: (thread: IEmailThread | null) => void;
  setScrollPosition: (position: number) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  folderId: string;
}

export default function ThreadList({
  selectedEmail,
  threads,
  setSelectedThread,
  setHoveredThread,
  setScrollPosition,
  scrollRef,
  folderId,
}: ThreadListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // 'threads' is initially empty so the div with 'observerTarget' doesn't render, so observerTarget is null,
  // and when the list is updated with data, the div renders but it doesnt update observerTarget. To fix this,
  // we add 'threads' to the dependency array of the useEffect hook.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadNextPage(selectedEmail.email, selectedEmail.provider, {
            folderId: folderId,
          });
        }
      },
      { root: null, rootMargin: "0px", threshold: 1 }
    );

    const target = observerTarget.current;

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [
    observerTarget,
    threads,
    selectedEmail.email,
    selectedEmail.provider,
    folderId,
  ]);

  async function handleStarClick(thread: IEmailThread) {
    if (thread.starred) {
      await unstarThread(
        selectedEmail.email,
        selectedEmail.provider,
        thread.id
      );
    } else {
      await starThread(selectedEmail.email, selectedEmail.provider, thread.id);
    }
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-scroll">
      <div className="flex flex-col w-full">
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

              <div
                onClick={() => {
                  setScrollPosition(scrollRef.current?.scrollTop || 0);
                  setSelectedThread(thread.id);
                  if (thread.unread) {
                    void markRead(
                      selectedEmail.email,
                      selectedEmail.provider,
                      thread.id
                    );
                  }
                }}
                onMouseOver={() => setHoveredThread(thread)}
                className="grid grid-cols-10 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-default group"
              >
                <div className="text-sm flex items-center font-medium pr-4 col-span-2 group">
                  <div className="group flex flex-col items-center justify-center px-2">
                    {thread.starred ? (
                      <button
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
                    {thread.from.slice(0, thread.from.lastIndexOf("<"))}
                  </span>
                </div>
                <div className="col-span-8 grid grid-cols-10">
                  <div className="text-sm truncate pr-4 col-span-2 text-black dark:text-zinc-100">
                    {thread.subject || "(no subject)"}
                  </div>
                  <div className="col-span-8 flex">
                    <div className="text-sm truncate text-slate-400 dark:text-zinc-500 w-full">
                      {/* {he.decode(
                        thread.snippet.slice(0, thread.snippet.indexOf("\n"))
                      )} */}
                      {he.decode(thread.snippet)}
                    </div>
                    {/* flex-shrink-0 is the class keeping the text from not expanding the height of the row */}
                    <div className="text-sm pl-2 pr-4 flex-shrink-0 text-zinc-400 dark:text-zinc-500 font-medium">
                      {new Date(thread.date).toDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {threads?.length ? (
          <div
            className="text-center text-xs text-slate-400 dark:text-zinc-500 py-2"
            ref={observerTarget}
          >
            Loading more emails...
          </div>
        ) : null}
      </div>
    </div>
  );
}
