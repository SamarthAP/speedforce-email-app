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
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { sendReply, sendReplyAll, forward } from "../lib/sync";
import { AttachmentButton } from "./AttachmentButton";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import toast from "react-hot-toast";
import { EmailSelectorInput } from "./EmailSelectorInput";
import Tiptap from "./Editors/TiptapEditor";
import { NewAttachment } from "../api/model/users.attachment";
import { dLog } from "../lib/noProd";

interface MessageProps {
  message: IMessage;
  key: string;
  selectedEmail: ISelectedEmail;
}

export default function Message({ message, selectedEmail }: MessageProps) {
  const [showBody, setShowBody] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [unsubscribingFromList, setUnsubscribingFromList] = useState(false);
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [editorMode, setEditorMode] = useState<
    "reply" | "replyAll" | "forward" | "none"
  >("none");
  const [forwardTo, setForwardTo] = useState<string[]>([]);
  const [forwardToCc, setForwardToCc] = useState<string[]>([]);
  const [forwardToBcc, setForwardToBcc] = useState<string[]>([]);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const replyRef = createRef<HTMLDivElement>();
  const listUnsubscribeHeader = getMessageHeader(
    message.headers,
    "List-Unsubscribe"
  );

  const handleClickReply = () => {
    setShowReply((prev) => !prev || editorMode !== "reply");
    setEditorMode("reply");
  };

  const handleClickReplyAll = () => {
    setShowReply((prev) => !prev || editorMode !== "replyAll");
    setEditorMode("replyAll");
  };

  const handleClickForward = () => {
    setShowReply((prev) => !prev || editorMode !== "forward");
    setEditorMode("forward");
  };

  const handleSendReply = async (content: string) => {
    let error: string | null = null;

    setSendingReply(true);
    if (editorMode === "reply") {
      ({ error } = await sendReply(
        selectedEmail.email,
        selectedEmail.provider,
        message,
        content
      ));
    } else if (editorMode === "replyAll") {
      ({ error } = await sendReplyAll(
        selectedEmail.email,
        selectedEmail.provider,
        message,
        content
      ));
    } else {
      ({ error } = await forward(
        selectedEmail.email,
        selectedEmail.provider,
        message,
        forwardTo,
        forwardToCc,
        forwardToBcc,
        content
      ));
    }

    if (error) {
      toast("Error sending messsage", { icon: "❌", duration: 5000 });
    } else {
      setShowReply(false);
      toast("Message sent", { icon: "📤", duration: 5000 });
    }
    setSendingReply(false);
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
                    handleClickReply();
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
                    handleClickReplyAll();
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
                    handleClickForward();
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

      {showReply && showBody && (
        <div
          className="p-4 mb-8 border-y border-t-slate-200 dark:border-t-zinc-700"
          ref={replyRef}
        >
          {editorMode === "reply" ? (
            <div className="text-sm dark:text-zinc-400 text-slate-500 my-2">
              Write reply to {message.from}
            </div>
          ) : editorMode === "replyAll" ? (
            <div className="text-sm dark:text-zinc-400 text-slate-500 my-2">
              Write reply to all
            </div>
          ) : editorMode === "forward" ? (
            <div className="text-sm dark:text-zinc-400 text-slate-500 mb-0.5">
              <EmailSelectorInput
                selectedEmail={selectedEmail}
                alignLabels="left"
                disableCC={selectedEmail.provider === "outlook"}
                toProps={{
                  text: "Fwd To",
                  emails: forwardTo,
                  setEmails: setForwardTo,
                }}
                ccProps={{
                  emails: forwardToCc,
                  setEmails: setForwardToCc,
                }}
                bccProps={{
                  emails: forwardToBcc,
                  setEmails: setForwardToBcc,
                }}
              />
            </div>
          ) : // <span className="flex flex-row items-center">
          // </span>
          null}

          <Tiptap
            initialContent=""
            attachments={attachments}
            setAttachments={setAttachments}
            canSendEmail={
              editorMode === "reply" ||
              editorMode === "replyAll" ||
              forwardTo.length > 0 ||
              forwardToCc.length > 0 ||
              forwardToBcc.length > 0
            }
            sendEmail={handleSendReply}
            sendingEmail={sendingReply}
            saveDraft={async () => {
              return { error: null };
            }}
          />
        </div>
      )}

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
