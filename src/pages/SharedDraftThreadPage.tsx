import { ISelectedEmail } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowSmallLeftIcon } from "@heroicons/react/20/solid";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import ShadowDom from "../components/ShadowDom";
import { getSharedDraft } from "../api/sharedDrafts";
import TooltipPopover from "../components/TooltipPopover";
import { useTooltip } from "../components/UseTooltip";
import CommentsChain from "../components/SharedDrafts/CommentsChain";
import { classNames } from "../lib/util";

interface SharedDraftThreadPageProps {
  selectedEmail: ISelectedEmail;
}

export default function SharedDraftThreadPage({
  selectedEmail,
}: SharedDraftThreadPageProps) {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const [messagePanelIsOpen, setMessagePanelIsOpen] = useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();

  const { data, isFetching } = useQuery("sharedDraft", async () => {
    if (!threadId) return;

    const { data, error } = await getSharedDraft(threadId, selectedEmail.email);
    if (error) {
      return null;
    }

    return data;
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* <Sidebar /> */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="flex px-4 pt-4">
            <div
              className="flex flex-row cursor-pointer items-center"
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
            >
              <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
              <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
                Back
              </p>
            </div>
          </div>
          {isFetching ? (
            <div className="flex justify-center items-center h-full w-full">
              <svg
                className={`h-12 w-12 animate-spin text-black dark:text-white`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="py-4 h-full w-full">
              {/* subject of email */}
              <div className="flex flex-row justify-between items-center px-8 mb-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-200">
                  {data?.subject || "(No subject)"}
                </h1>
                <button
                  className="p-2 mt-2 hover:bg-slate-200 dark:hover:bg-zinc-600 rounded-full"
                  onMouseEnter={(event) => {
                    handleShowTooltip(event, "Comments");
                  }}
                  onMouseLeave={handleHideTooltip}
                  onClick={() => setMessagePanelIsOpen((val) => !val)}
                >
                  <ChatBubbleBottomCenterTextIcon className="h-5 w-5 shrink-0 dark:text-zinc-300 text-black" />
                </button>
              </div>
              <div className="h-full w-full flex flex-row">
                <div
                  className={classNames(
                    "h-full w-full flex flex-col pl-8",
                    messagePanelIsOpen ? "pr-4" : "pr-8"
                  )}
                >
                  {/* email recipients */}
                  <EmailSelectorInput
                    selectedEmail={selectedEmail}
                    alignLabels="left"
                    readOnly
                    toProps={{
                      text: "To",
                      emails: data?.recipients || [],
                    }}
                    ccProps={{
                      text: "Cc",
                      emails: data?.cc || [],
                    }}
                    bccProps={{
                      text: "Bcc",
                      emails: data?.bcc || [],
                    }}
                  />

                  {/* email body */}
                  <div className="py-4">
                    {data?.html_data ? (
                      <ShadowDom
                        htmlString={data.html_data}
                        showImages={true}
                      />
                    ) : (
                      <p className="text-slate-500 dark:text-zinc-500">
                        No message body
                      </p>
                    )}
                  </div>
                </div>
                <CommentsChain
                  threadId={data?.owner_thread_id || ""}
                  editMode={true}
                  visible={messagePanelIsOpen}
                  selectedEmail={selectedEmail}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
