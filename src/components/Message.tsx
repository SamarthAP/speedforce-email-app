import { createRef, useState } from "react";
import dayjs from "dayjs";
import { IMessage, ISelectedEmail } from "../lib/db";
import {
  classNames,
  cleanHtmlString,
  getMessageHeader,
  listUnsubscribe,
} from "../lib/util";
import ShadowDom from "./ShadowDom";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import { AttachmentButton } from "./AttachmentButton";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { NewAttachment } from "../api/model/users.attachment";
import { DraftReplyType } from "../api/model/users.draft";
import { handleCreateDraft } from "../lib/asyncHelpers";
import { buildForwardedHTML } from "../api/gmail/helpers";

interface MessageProps {
  message: IMessage;
  key: string;
  selectedEmail: ISelectedEmail;
  isLast?: boolean;
  scrollToBottom: () => void;
}

export default function Message({
  message,
  selectedEmail,
  isLast,
  scrollToBottom,
}: MessageProps) {
  // if isLast is true, then show the body and scroll to the bottom of the message
  const [showBody, setShowBody] = useState(isLast || false);
  const [showImages, setShowImages] = useState(true);
  const [unsubscribingFromList, setUnsubscribingFromList] = useState(false);

  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const listUnsubscribeHeader = getMessageHeader(
    message.headers,
    "List-Unsubscribe"
  );

  const createReplyDraft = async (
    message: IMessage,
    replyMode: DraftReplyType
  ) => {
    // Use the RFC2822 message id header for gmail, and the message id for outlook replies
    const inReplyTo =
      selectedEmail.provider === "google"
        ? getMessageHeader(message.headers, "Message-ID")
        : message.id;

    if (replyMode === DraftReplyType.REPLY) {
      const to =
        getMessageHeader(message.headers, "From").match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
        )?.[0] ||
        getMessageHeader(message.headers, "To") ||
        "";

      await handleCreateDraft(
        selectedEmail.email,
        selectedEmail.provider,
        [to],
        [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        "",
        message.threadId,
        DraftReplyType.REPLY,
        inReplyTo
      );
    } else if (replyMode === DraftReplyType.REPLYALL) {
      const to =
        getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g) || [];
      const from =
        getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g) ||
        [];

      await handleCreateDraft(
        selectedEmail.email,
        selectedEmail.provider,
        [...from, ...to].filter((email) => email !== selectedEmail.email),
        getMessageHeader(message.headers, "Cc").match(/[\w.-]+@[\w.-]+/g) || [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        "",
        message.threadId,
        DraftReplyType.REPLYALL,
        inReplyTo
      );
    } else if (replyMode === DraftReplyType.FORWARD) {
      const fwdHtml = await buildForwardedHTML(message);

      await handleCreateDraft(
        selectedEmail.email,
        selectedEmail.provider,
        [],
        [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        fwdHtml,
        message.threadId,
        DraftReplyType.FORWARD,
        inReplyTo
      );
    }

    scrollToBottom();
  };

  const handleUnsubscribe = () => {
    if (!listUnsubscribeHeader) return;

    setUnsubscribingFromList(true);
    void listUnsubscribe(
      listUnsubscribeHeader,
      selectedEmail.email,
      selectedEmail.provider
    ).then(() => {
      setUnsubscribingFromList(false);
    });
  };

  return (
    <div className="w-full h-auto flex flex-col border border-slate-200 dark:border-zinc-700">
      <div
        onClick={() => setShowBody((old) => !old)}
        className="flex justify-between p-4 cursor-pointer"
      >
        <p className="dark:text-zinc-400 text-slate-500 text-sm">
          {message.from}
        </p>
        <div className="flex items-center">
          {showBody && (
            <>
              {/* <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Star");
                }}
                onMouseLeave={handleHideTooltip}
              >
                {message.labelIds.includes("STARRED") ? (
                  <StarIconSolid
                    onClick={(e) => {
                      e.stopPropagation();
                      // star the message, not thread.
                    }}
                    className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                  />
                ) : (
                  <StarIconOutline
                    onClick={(e) => {
                      e.stopPropagation();
                      // star the message, not thread.
                    }}
                    className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                  />
                )}
              </div> */}
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Reply");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <ArrowUturnLeftIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, DraftReplyType.REPLY);
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </div>
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Reply All");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <svg
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, DraftReplyType.REPLYALL);
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3 M13 15L7 9m0 0l6-6"
                  ></path>
                </svg>
              </div>
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Forward");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <ArrowUturnRightIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, DraftReplyType.FORWARD);
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </div>
              <TooltipPopover
                message={tooltipData.message}
                showTooltip={tooltipData.showTooltip}
                coords={tooltipData.coords}
              />
            </>
          )}
          <p className="dark:text-zinc-400 text-slate-500 text-sm">
            {dayjs(message.date).format("MMM D, YYYY h:mm A")}
          </p>
        </div>
      </div>
      <div className="flex gap-x-1 px-4 pb-4">
        <button
          className={classNames(
            "inline-flex items-center ",
            "rounded-md px-2 py-1",
            "ring-1 ring-inset",
            "text-xs font-medium",
            "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
          )}
          onClick={() => setShowImages((old) => !old)}
        >
          {showImages ? "Hide Images" : "Show Images"}
        </button>
        {listUnsubscribeHeader && (
          <button
            className={classNames(
              "inline-flex items-center ",
              "rounded-md px-2 py-1",
              "ring-1 ring-inset",
              "text-xs font-medium",
              "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
            )}
            disabled={unsubscribingFromList}
            onClick={handleUnsubscribe}
          >
            Unsubscribe
          </button>
        )}
      </div>

      {showBody && (
        <div className="pb-4 px-4">
          {/* TODO: Verify that this is valid solution -> Assume google HTML is encoded and outlook is not */}
          <ShadowDom
            htmlString={cleanHtmlString(message.htmlData)}
            showImages={showImages}
          />
        </div>
      )}

      {
        <div className="p-4 flex gap-x-1 overflow-scroll hide-scroll">
          {message.attachments.map((attachment, idx) => (
            <AttachmentButton
              key={idx}
              attachment={attachment}
              messageId={message.id}
              selectedEmail={selectedEmail}
            />
          ))}
        </div>
      }
    </div>
  );
}
