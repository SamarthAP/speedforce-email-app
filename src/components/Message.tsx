import { createRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import { IMessage } from "../lib/db";
import { classNames, cleanHtmlString } from "../lib/util";
import ShadowDom from "./ShadowDom";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { Editor } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { partialSync, sendReply, sendReplyAll, forward } from "../lib/sync";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import SimpleButton from "./SimpleButton";
import { AttachmentButton } from "./AttachmentButton";
import Tooltip from "./Tooltip";

interface MessageProps {
  message: IMessage;
  key: string;
  folderId: string;
}

export default function Message({ message, folderId }: MessageProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [showBody, setShowBody] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [editorMode, setEditorMode] = useState<
    "reply" | "replyAll" | "forward" | "none"
  >("none");
  const [forwardTo, setForwardTo] = useState("");

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
    if (editorMode === "forward") {
      const toRecipients = forwardTo.split(/[ ,]+/);

      ({ error } = await forward(
        selectedEmail.email,
        selectedEmail.provider,
        message.id,
        toRecipients
      ));
    } else if (editorComponentRef.current) {
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
      }
    }

    if (error) {
      console.log(error);
    } else {
      await partialSync(selectedEmail.email, selectedEmail.provider, {
        folderId: folderId,
      });
      setShowReply(false);
    }
    setSendingReply(false);
  };

  useEffect(() => {
    if (showReply) {
      if (replyRef.current) {
        if (editorRef.current) {
          editorRef.current.focus();
        }
        replyRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [showReply, replyRef, editorRef]);

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
              <Tooltip text="Reply">
                <ArrowUturnLeftIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickReply();
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </Tooltip>
              <Tooltip text="Reply All">
                <ArrowUturnLeftIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickReplyAll();
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </Tooltip>
              <Tooltip text="Forward">
                <ArrowUturnRightIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickForward();
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </Tooltip>
            </>
          )}
          <p className="dark:text-zinc-400 text-slate-500 text-sm">
            {dayjs(message.date).format("MMM D, YYYY h:mm A")}
          </p>
        </div>
      </div>

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
            htmlString={cleanHtmlString(
              message.htmlData,
              selectedEmail.provider === "google"
            )}
            showImages={showImages}
          />
        </div>
      )}

      {
        <div className="p-4 flex gap-x-1 overflow-scroll">
          {message.attachments.map((attachment, idx) => (
            <AttachmentButton
              key={idx}
              attachment={attachment}
              messageId={message.id}
            />
          ))}
        </div>
      }

      {showReply && (
        <div
          className="p-4 border-t border-t-slate-200 dark:border-t-zinc-700"
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
            <span className="w-full flex flex-row items-center">
              <div className="text-sm dark:text-zinc-400 text-slate-500 mr-4 whitespace-nowrap">
                Forward to
              </div>
              <input
                onChange={(event) => setForwardTo(event.target.value)}
                type="email"
                name="forwardTo"
                id="forwardTo"
                className="w-full block bg-transparent border-0 pr-20 dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6 border-bottom"
                placeholder="..."
              />
            </span>
          ) : null}

          {["reply", "replyAll"].includes(editorMode) && (
            <EmailEditor editorRef={editorRef} ref={editorComponentRef} />
          )}

          <SimpleButton
            onClick={() => void handleSendReply()}
            loading={sendingReply}
            text="Send"
            width="w-16"
          />
        </div>
      )}
    </div>
  );
}
