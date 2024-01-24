import { createRef, useState } from "react";
import dayjs from "dayjs";
import { IMessage, ISelectedEmail } from "../lib/db";
import { classNames, cleanHtmlString } from "../lib/util";
import ShadowDom from "./ShadowDom";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { Editor } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { sendReply, sendReplyAll, forward } from "../lib/sync";
import SimpleButton from "./SimpleButton";
import { AttachmentButton } from "./AttachmentButton";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import toast from "react-hot-toast";
import { EmailSelectorInput } from "./EmailSelectorInput";

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
  const [editorMode, setEditorMode] = useState<
    "reply" | "replyAll" | "forward" | "none"
  >("none");
  const [forwardTo, setForwardTo] = useState<string[]>([]);
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();

  const replyRef = createRef<HTMLDivElement>();
  const editorRef = createRef<Editor>();
  const editorComponentRef = createRef<EditorComponentRef>();

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

  const handleSendReply = async () => {
    let error: string | null = null;

    setSendingReply(true);
    if (editorComponentRef.current) {
      const editorState = editorComponentRef.current.getEditorState();
      const context = editorState.getCurrentContent();
      const html = stateToHTML(context);

      if (editorMode === "reply") {
        ({ error } = await sendReply(
          selectedEmail.email,
          selectedEmail.provider,
          message,
          html
        ));
      } else if (editorMode === "replyAll") {
        ({ error } = await sendReplyAll(
          selectedEmail.email,
          selectedEmail.provider,
          message,
          html
        ));
      } else {
        ({ error } = await forward(
          selectedEmail.email,
          selectedEmail.provider,
          message,
          forwardTo,
          html
        ));
      }
    }

    if (error) {
      toast("Error sending messsage", { icon: "❌", duration: 5000 });
    } else {
      setShowReply(false);
    }
    setSendingReply(false);
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
              <div
                onMouseEnter={(event) => {
                  handleMouseEnter(event, "Reply");
                }}
                onMouseLeave={handleMouseLeave}
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
                  handleMouseEnter(event, "Reply All");
                }}
                onMouseLeave={handleMouseLeave}
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
                  handleMouseEnter(event, "Forward");
                }}
                onMouseLeave={handleMouseLeave}
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
            <div className="text-sm dark:text-zinc-400 text-slate-500 mb-2">
              Write reply to {message.from}
            </div>
          ) : editorMode === "replyAll" ? (
            <div className="text-sm dark:text-zinc-400 text-slate-500 mb-2">
              Write reply to all
            </div>
          ) : editorMode === "forward" ? (
            <div className="text-sm dark:text-zinc-400 text-slate-500 mb-2">
              <EmailSelectorInput
                text="Fwd To"
                selectedEmail={selectedEmail}
                emails={forwardTo}
                setEmails={setForwardTo}
              />
            </div>
          ) : // <span className="flex flex-row items-center">
          // </span>
          null}

          <EmailEditor editorRef={editorRef} ref={editorComponentRef} />

          <SimpleButton
            onClick={() => void handleSendReply()}
            loading={sendingReply}
            text="Send"
            width="w-16"
          />
        </div>
      )}

      <div className="flex px-4 pb-4">
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
