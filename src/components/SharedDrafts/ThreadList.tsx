import he from "he";
import { useNavigate } from "react-router-dom";
import { useHoveredThreadContext } from "../../contexts/HoveredThreadContext";

interface SharedDraftThreadListProps {
  threads: {
    id: string;
    threadId: string;
    from: string;
    subject: string;
    to: string;
    cc: string;
    bcc: string;
    snippet: string;
    html: string;
  }[];
}

export const SharedDraftThreadList = ({
  threads,
}: SharedDraftThreadListProps) => {
  const navigate = useNavigate();
  const hoveredThreadContext = useHoveredThreadContext();

  function handleThreadClick(threadId: string) {
    navigate(`/sharedDraft/${threadId}`);
  }

  return (
    <div>
      {threads.length > 0 ? (
        threads.map((thread, index) => (
          <div className="relative" key={thread.id}>
            <div
              onClick={() => handleThreadClick(thread.threadId)}
              onMouseOver={(
                e: React.MouseEvent<HTMLDivElement, MouseEvent>
              ) => {
                hoveredThreadContext.setThreadIndex(index);
              }}
              // onMouseLeave={() => {
              //   setShowSummaryCard(false);
              // }}
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
                    {he.decode(thread.snippet)}
                  </div>
                  <div className="text-sm pl-2 pr-4 flex-shrink-0 text-slate-400 dark:text-zinc-500 font-medium flex flex-col justify-center">
                    {/* <span className="group-hover:hidden block">
                    {isToday(new Date(thread.date))
                      ? new Date(thread.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(thread.date).toDateString()}
                  </span> */}
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
