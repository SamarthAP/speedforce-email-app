import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmail, IEmailThread, db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import { ThreadFeed } from "../ThreadFeed";
import AssistBar from "../AssistBar";
import AccountActionsMenu from "../AccountActionsMenu";
import { fullSync, partialSync } from "../../lib/sync";
import { PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SelectedThreadBar from "../SelectedThreadBar";
import TooltipPopover from "../TooltipPopover";
import { useTooltip } from "../UseTooltip";
import { classNames } from "../../lib/util";
import { ClientInboxTabType } from "../../api/model/client.inbox";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import SearchBar from "../SearchBar";
import { useInboxZeroBackgroundContext } from "../../contexts/InboxZeroBackgroundContext";

const MAX_RENDER_COUNT = 5;
const MIN_REFRESH_DELAY_MS = 1000;

interface ThreadViewProps {
  data: ClientInboxTabType;
  searchItems?: string[];
  setSearchItems?: (searchItems: string[]) => void;
  wrapperType?: string;
}

export default function ThreadView({
  data,
  searchItems,
  setSearchItems,
  wrapperType,
}: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  // const [data, setdata] = useState<ClientInboxTabType>(tabs[0]);
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [writeEmailMode, setWriteEmailMode] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
  const navigate = useNavigate();
  const { isBackgroundOn, setIsBackgroundOn } = useInboxZeroBackgroundContext();

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

  const threadsList = useLiveQuery(
    () => {
      if (data.filterThreadsFnc) return data.filterThreadsFnc(selectedEmail);

      const emailThreads = db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => thread.labelIds?.includes(data.folderId))
        .reverse()
        .sortBy("date");

      return emailThreads;
    },
    [selectedEmail, data],
    []
  );

  const threads: IEmailThread[] = useMemo(() => {
    let threads: IEmailThread[] = [];

    if (threadsList.length && threadsList[0].id === "fake") {
      threads = threadsList.slice(1);
    } else {
      threads = threadsList;
    }

    return threads;
  }, [threadsList]);

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if (renderCounter.current > 1 && renderCounter.current < MAX_RENDER_COUNT) {
      // If there are no threadsList in the db, do a full sync
      // TODO: Do a partial sync periodically to check for new threads (when not empty)
      if (threadsList?.length === 0) {
        void fullSync(selectedEmail.email, selectedEmail.provider, {
          folderId: data.folderId,
          gmailQuery: data.gmailQuery,
          outlookQuery: data.outlookQuery,
        });
      }
    }
  }, [data, selectedEmail, threadsList]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    const startTime = new Date().getTime();

    // TODO: Partial sync if metadata, or else full sync
    await partialSync(selectedEmail.email, selectedEmail.provider, {
      folderId: data.folderId,
      gmailQuery: data.gmailQuery,
      outlookQuery: data.outlookQuery,
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

  const handleSearchClick = () => {
    navigate("/search");
  };

  if (selectedThread) {
    return (
      <React.Fragment>
        <ThreadFeed
          selectedThread={selectedThread}
          setSelectedThread={setSelectedThread}
          folderId={data.folderId}
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
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <div className="flex flex-row items-center justify-between">
          <nav className="flex items-center pl-6" aria-label="Tabs">
            <h2
              className={classNames(
                "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                "font-medium text-black dark:text-white"
              )}
            >
              {data.title}
            </h2>
          </nav>
          <div className="flex items-center">
            <button
              className="mr-3"
              onMouseEnter={(event) => {
                handleMouseEnter(event, "Compose");
              }}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                navigate("/compose");
                setWriteEmailMode(true);
              }}
            >
              <PencilSquareIcon
                className={classNames(
                  "h-5 w-5 shrink-0",
                  isBackgroundOn ? "text-white" : "text-black dark:text-white"
                )}
              />
            </button>
            <button
              className="mr-3"
              onMouseEnter={(event) => {
                handleMouseEnter(event, "Search");
              }}
              onMouseLeave={handleMouseLeave}
              onClick={handleSearchClick}
            >
              <MagnifyingGlassIcon
                className={classNames(
                  "h-5 w-5 shrink-0",
                  isBackgroundOn ? "text-white" : "text-black dark:text-white"
                )}
              />
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
                  "h-5 w-5 shrink-0",
                  isBackgroundOn ? "text-white" : "text-black dark:text-white",
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
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
          folderId={data.folderId}
          canArchiveThread={data.canArchiveThread}
          canTrashThread={data.canTrashThread}
          canPermanentlyDeleteThread={data.canDeletePermanentlyThread}
        />
      </div>
      <AssistBar thread={hoveredThread} setSelectedThread={setSelectedThread} />
    </React.Fragment>
  );
}
