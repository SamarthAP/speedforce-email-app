import he from "he";
import { useNavigate } from "react-router-dom";
import { useHoveredThreadContext } from "../contexts/HoveredThreadContext";
import { useDisableMouseHoverContext } from "../contexts/DisableMouseHoverContext";
import { useEffect, useRef } from "react";
import { getSnippetFromHtml } from "../lib/util";
import { IDraft, ISelectedEmail } from "../lib/db";
import { TrashIcon } from "@heroicons/react/20/solid";
import { useTooltip } from "./UseTooltip";
import TooltipPopover from "./TooltipPopover";
import { handleDiscardDraft } from "../lib/asyncHelpers";
import toast from "react-hot-toast";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { DraftStatusType } from "../api/model/users.draft";

interface DraftThreadListProps {
  drafts: IDraft[];
}

function isToday(date: Date) {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export const DraftThreadList = ({ drafts }: DraftThreadListProps) => {
  const { selectedEmail } = useEmailPageOutletContext();
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();

  return (
    <div className="h-full flex flex-col overflow-y-scroll hide-scroll">
      {drafts && drafts.length > 0 ? (
        drafts.map((draft, index) => (
          <DraftThreadListRow
            selectedEmail={selectedEmail}
            draft={draft}
            index={index}
            key={draft.id}
            handleShowTooltip={handleShowTooltip}
            handleHideTooltip={handleHideTooltip}
          />
        ))
      ) : (
        <div className="h-1/2">
          <p className="text-slate-400 dark:text-zinc-500 text-sm italic pl-8">
            Looks like you don&apos;t have any drafts
          </p>
        </div>
      )}
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
};

interface DraftThreadListRowProps {
  selectedEmail: ISelectedEmail;
  draft: IDraft;
  index: number;
  handleShowTooltip: (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => void;
  handleHideTooltip: () => void;
}

export const DraftThreadListRow = ({
  selectedEmail,
  draft,
  index,
  handleShowTooltip,
  handleHideTooltip,
}: DraftThreadListRowProps) => {
  const navigate = useNavigate();
  const hoveredThreadContext = useHoveredThreadContext();
  const itemRef = useRef<HTMLDivElement>(null);
  const disableMouseHoverContext = useDisableMouseHoverContext();
  const isHovered = hoveredThreadContext.threadIndex === index;

  function handleThreadClick(draft: IDraft) {
    if (draft.threadId) {
      navigate(`/thread/${draft.threadId}`);
    } else {
      navigate(`/draft/${draft.id}`);
    }
  }

  async function handleTrashClick(draft: IDraft) {
    console.log("trash", draft);
    const { error } = await handleDiscardDraft(
      selectedEmail.email,
      draft.id,
      DraftStatusType.DISCARDED
    );

    if (error) {
      toast.error("Error discarding draft");
      return;
    }

    toast.success("Draft discarded");
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
        onClick={() => handleThreadClick(draft)}
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
            {draft.to || "(no recipients)"}
          </span>
        </div>
        <div className="col-span-8 flex overflow-hidden">
          <div className="flex max-w-[50%]">
            <div className="text-sm truncate pr-4 col-span-2 text-black dark:text-zinc-100">
              {draft.subject || "(no subject)"}
            </div>
          </div>

          <div className="flex flex-grow overflow-hidden">
            <div className="text-sm truncate text-slate-400 dark:text-zinc-500 w-full">
              {he.decode(getSnippetFromHtml(draft.html))}
            </div>
            <div className="text-sm pl-2 pr-4 flex-shrink-0 text-slate-400 dark:text-zinc-500 font-medium flex flex-col justify-center">
              <span className="group-hover:hidden block">
                {isToday(new Date(draft.date))
                  ? new Date(draft.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date(draft.date).toDateString()}
              </span>

              <button
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Discard Draft");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={(
                  event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  event.stopPropagation();
                  void handleTrashClick(draft);
                  // void handleTrashClick(thread);
                }}
                className="ml-1 group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
              >
                <TrashIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 " />
              </button>
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
