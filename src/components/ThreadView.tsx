import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import { IEmail, IEmailThread, ISelectedEmail, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { ThreadFeed } from "../components/ThreadFeed";
import AssistBar from "../components/AssistBar";
import { TestSyncButtons } from "../lib/experiments";
import AccountActionsMenu from "./AccountActionsMenu";
import { fullSync, partialSync } from "../lib/sync";
import { PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { WriteMessage } from "../components/WriteMessage";
import SelectedThreadBar from "./SelectedThreadBar";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { classNames } from "../lib/util";

const MAX_RENDER_COUNT = 5;
const MIN_REFRESH_DELAY_MS = 1000;

interface ThreadViewProps {
  folderId: string;
  title: string;
  filterThreadsFnc?: (selectedEmail: ISelectedEmail) => Promise<IEmailThread[]>;
  gmailFetchQuery?: string;
  outlookFetchQuery?: string;
  canArchiveThread?: boolean;
  canTrashThread?: boolean;
}

export default function ThreadView({
  folderId,
  title,
  filterThreadsFnc,
  gmailFetchQuery = "",
  outlookFetchQuery = "",
  canArchiveThread = false,
  canTrashThread = false,
}: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [writeEmailMode, setWriteEmailMode] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();

  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  useEffect(() => {
    if (scrollRef.current) {
      const divVisibleHeight = scrollRef.current.clientHeight;
      const divScrollHeight = scrollRef.current.scrollHeight;
      const maxScroll = divScrollHeight - divVisibleHeight;

      if (scrollPosition > maxScroll) {
        setScrollPosition(maxScroll);
      }

      scrollRef.current.scrollTo(0, scrollPosition);
    }
  }, [selectedThread, scrollPosition]);

  const threads = useLiveQuery(
    () => {
      if (filterThreadsFnc) return filterThreadsFnc(selectedEmail);

      const emailThreads = db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => thread.labelIds?.includes(folderId))
        .reverse()
        .sortBy("date");

      return emailThreads;
    },
    [selectedEmail],
    [] // default value
  );

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if (renderCounter.current > 1 && renderCounter.current < MAX_RENDER_COUNT) {
      // If there are no threads in the db, do a full sync
      // TODO: Do a partial sync periodically to check for new threads (when not empty)
      if (threads?.length === 0) {
        void fullSync(selectedEmail.email, selectedEmail.provider, {
          folderId: folderId,
          gmailQuery: gmailFetchQuery,
          outlookQuery: outlookFetchQuery,
        });
      }
    }
  }, [folderId, selectedEmail.email, selectedEmail.provider, threads]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    const startTime = new Date().getTime();

    // TODO: Partial sync if metadata, or else full sync
    await partialSync(selectedEmail.email, selectedEmail.provider, {
      folderId: folderId,
      gmailQuery: gmailFetchQuery,
      outlookQuery: outlookFetchQuery,
    });

    // If sync duration < MIN_REFRESH_DELAY_MS, wait until MIN_REFRESH_DELAY_MS has passed
    // Generally, this function will always take MIN_REFRESH_DELAY_MS
    const endTime = new Date().getTime();
    if (endTime - startTime < MIN_REFRESH_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REFRESH_DELAY_MS - (endTime - startTime))
      );
    }

    setRefreshing(false);
  };

  if (writeEmailMode) {
    return (
      <React.Fragment>
        <WriteMessage setWriteEmailMode={setWriteEmailMode} />
        {/* TODO: Create another Bar component for this that is more helpful for writing emails */}
        <AssistBar
          thread={hoveredThread}
          setSelectedThread={setSelectedThread}
        />
      </React.Fragment>
    );
  }

  if (selectedThread) {
    return (
      <React.Fragment>
        <ThreadFeed
          selectedThread={selectedThread}
          setSelectedThread={setSelectedThread}
          folderId={folderId}
        />
        <SelectedThreadBar
          thread={selectedThread}
          email={selectedEmail.email}
        />
      </React.Fragment>
    );
  }

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
    });
  };

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-medium select-none pl-8 tracking-wide my-4 text-black dark:text-white">
            {title}
          </h2>
          <div className="flex items-center">
            <button
              className="mr-3"
              onMouseEnter={(event) => {
                handleMouseEnter(event, "Compose");
              }}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                setWriteEmailMode(true);
              }}
            >
              <PencilSquareIcon className="h-5 w-5 mb-2 shrink-0 text-black dark:text-white" />
            </button>
            <button
              className="mr-3"
              onMouseEnter={(event) => {
                handleMouseEnter(event, "Refresh");
              }}
              onMouseLeave={handleMouseLeave}
              onClick={refreshing ? void 0 : handleRefreshClick}
            >
              <ArrowPathIcon
                className={classNames(
                  "h-5 w-5 mb-2 shrink-0 text-black dark:text-white",
                  refreshing ? "animate-spin" : ""
                )}
              />
            </button>
            <AccountActionsMenu
              selectedEmail={selectedEmail}
              setSelectedEmail={(email) => void setSelectedEmail(email)}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
            />
            <TooltipPopover
              message={tooltipData.message}
              showTooltip={tooltipData.showTooltip}
              coords={tooltipData.coords}
            />
          </div>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <TestSyncButtons
            folderId={folderId}
            gmailFetchQuery={gmailFetchQuery}
            outlookFetchQuery={outlookFetchQuery}
          />
        ) : null}
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
          folderId={folderId}
          canArchiveThread={canArchiveThread}
          canTrashThread={canTrashThread}
        />
      </div>
      <AssistBar thread={hoveredThread} setSelectedThread={setSelectedThread} />
    </React.Fragment>
  );
}
