import AccountActionsMenu from "./AccountActionsMenu";
import { PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { partialSync } from "../lib/sync";
import { ISelectedEmail } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";

const MIN_REFRESH_DELAY_MS = 1000;

interface InboxActionBarProps {
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  selectedEmail: ISelectedEmail;
  selectedTab: ClientInboxTabType;
}

export default function InboxActionBar({
  refreshing,
  setRefreshing,
}: InboxActionBarProps) {
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
  const handleRefreshClick = async () => {
    setRefreshing(true);
    const startTime = new Date().getTime();

    // TODO: Partial sync if metadata, or else full sync
    await partialSync(selectedEmail.email, selectedEmail.provider, {
      folderId: selectedTab.folderId,
      gmailQuery: selectedTab.gmailQuery,
      outlookQuery: selectedTab.outlookQuery,
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

  return (
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
        <PencilSquareIcon className="h-5 w-5 shrink-0 text-black dark:text-white" />
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
            "h-5 w-5 shrink-0 text-black dark:text-white",
            refreshing ? "animate-spin" : ""
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
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-black dark:text-white" />
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
  );
}
