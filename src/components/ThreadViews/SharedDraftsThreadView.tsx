import { useEffect, useState } from "react";
import PersonalAI from "../AI/PersonalAI";
import Sidebar from "../Sidebar";
import Titlebar from "../Titlebar";
import { classNames } from "../../lib/util";
import { IEmail, ISelectedEmail, db } from "../../lib/db";
import { useTooltip } from "../UseTooltip";
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import AccountActionsMenu from "../AccountActionsMenu";
import TooltipPopover from "../TooltipPopover";
import AssistBar from "../AssistBar";
import { SharedDraftThreadList } from "../SharedDrafts/ThreadList";
import { listSharedDrafts } from "../../api/sharedDrafts";

interface SharedDraftsThreadViewProps {
  selectedEmail: ISelectedEmail;
}

export default function SharedDraftsThreadView({
  selectedEmail,
}: SharedDraftsThreadViewProps) {
  const [showPersonalAi, setShowPersonalAi] = useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<
    {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      to: string;
      cc: string;
      bcc: string;
      snippet: string;
      html: string;
    }[]
  >([]);

  useEffect(() => {
    const getSharedDrafts = async () => {
      const { data, error } = await listSharedDrafts(selectedEmail.email);
      if (error) {
        return;
      }

      setThreads(data);
    };

    void getSharedDrafts();
  }, [selectedEmail.email]);

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  const handleSearchClick = () => {
    navigate("/search");
  };

  return (
    <div
      className={`overflow-hidden h-screen w-screen flex flex-col fadeIn-animation bg-cover bg-center`}
    >
      <Titlebar />
      <PersonalAI show={showPersonalAi} hide={() => setShowPersonalAi(false)} />

      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <div className="w-full h-full flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <nav className="flex items-center pl-6">
              <h2
                className={classNames(
                  "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                  "font-medium text-black dark:text-white"
                )}
              >
                Shared With Me
              </h2>
            </nav>
            <div className="flex items-center">
              {selectedEmail.provider === "google" && (
                <button
                  className="mr-3"
                  onMouseEnter={(event) => {
                    handleShowTooltip(event, "AI");
                  }}
                  onMouseLeave={handleHideTooltip}
                  onClick={() => {
                    setShowPersonalAi(true);
                  }}
                >
                  <SparklesIcon
                    className={classNames(
                      "h-5 w-5 shrink-0",
                      "text-black dark:text-white"
                    )}
                  />
                </button>
              )}
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Compose");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={() => {
                  navigate("/compose");
                }}
              >
                <PencilSquareIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    "text-black dark:text-white"
                  )}
                />
              </button>
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Search");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={handleSearchClick}
              >
                <MagnifyingGlassIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    "text-black dark:text-white"
                  )}
                />
              </button>
              <AccountActionsMenu
                selectedEmail={selectedEmail}
                setSelectedEmail={(email) => void setSelectedEmail(email)}
                handleShowtooltip={handleShowTooltip}
                handleHideTooltip={handleHideTooltip}
              />

              <TooltipPopover
                message={tooltipData.message}
                showTooltip={tooltipData.showTooltip}
                coords={tooltipData.coords}
              />
            </div>
          </div>
          <SharedDraftThreadList threads={threads} />
        </div>
        <AssistBar thread={null} />
      </div>
    </div>
  );
}
