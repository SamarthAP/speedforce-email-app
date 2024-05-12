import he from "he";
import { useNavigate } from "react-router-dom";
import { useHoveredThreadContext } from "../../contexts/HoveredThreadContext";
import { useDisableMouseHoverContext } from "../../contexts/DisableMouseHoverContext";
import { useEffect, useRef } from "react";
import { getSnippetFromHtml, isToday } from "../../lib/util";

interface SharedDraftThreadListProps {
  threads?: {
    id: string;
    from: string;
    subject: string;
    to: string;
    cc: string;
    bcc: string;
    date: number;
    html: string;
  }[];
}

export const SharedDraftThreadList = ({
  threads,
}: SharedDraftThreadListProps) => {
  return (
    <div className="h-full flex flex-col overflow-y-scroll hide-scroll">
      {threads && threads.length > 0 ? (
        threads.map((thread, index) => (
          <SharedDraftThreadListRow
            thread={thread}
            index={index}
            key={thread.id}
          />
        ))
      ) : (
        <div className="h-1/2">
          <p className="text-slate-400 dark:text-zinc-500 text-sm italic pl-8">
            Looks like you don&apos;t have any shared drafts
          </p>
        </div>
      )}
    </div>
  );
};

interface SharedDraftThreadListRowProps {
  thread: {
    id: string;
    from: string;
    subject: string;
    to: string;
    cc: string;
    bcc: string;
    date: number;
    html: string;
  };
  index: number;
}

export const SharedDraftThreadListRow = ({
  thread,
  index,
}: SharedDraftThreadListRowProps) => {
  const navigate = useNavigate();
  const hoveredThreadContext = useHoveredThreadContext();
  const itemRef = useRef<HTMLDivElement>(null);
  const disableMouseHoverContext = useDisableMouseHoverContext();
  const isHovered = hoveredThreadContext.threadIndex === index;
  function handleThreadClick(draftId: string) {
    navigate(`/sharedDraft/${draftId}`);
  }

  useEffect(() => {
    if (isHovered && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth", // smooth or instant
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [isHovered]);

  return (
    <div className="relative" ref={itemRef}>
      <div
        onClick={() => handleThreadClick(thread.id)}
        onMouseOver={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (!disableMouseHoverContext.disableMouseHover) {
            hoveredThreadContext.setThreadIndex(index);
          }
        }}
        className={`relative grid grid-cols-10 py-1 cursor-default group ${
          hoveredThreadContext.threadIndex === index
            ? "bg-slate-100 dark:bg-zinc-800"
            : ""
        }`}
      >
        <div className="text-sm flex items-center font-medium px-4 col-span-2">
          <span className="truncate text-black dark:text-zinc-100">
            {thread.from.slice(0, thread.from.lastIndexOf("<"))}
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
              {he.decode(getSnippetFromHtml(thread.html))}
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
            </div>
          </div>
        </div>
        {/* <HorizontalAttachments
              thread={thread}
              selectedEmail={selectedEmail}
            /> */}
      </div>
      {/* need to render card and unrender it like this to reset the timeout. if we instead pass a "show" prop, then the timeout will not reset (i think) */}
      {/* {showSummaryCard && (
            <ThreadSummaryHoverCard
              threadId={thread.id}
              threadSubject={thread.subject}
            />
          )} */}
    </div>
  );
};
