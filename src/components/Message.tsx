import { createRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import { IMessage } from "../lib/db";
import { cleanHtmlString } from "../lib/util";
import ShadowDom from "./ShadowDom";
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from "@heroicons/react/24/outline";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { Editor } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { partialSync, sendReply, sendReplyAll } from "../lib/sync";
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
  const [sendingReply, setSendingReply] = useState(false);
  const [editorMode, setEditorMode] = useState<"reply" | "replyAll" | "forward" | "none">("none");

  const replyRef = createRef<HTMLDivElement>();
  const editorRef = createRef<Editor>();
  const editorComponentRef = createRef<EditorComponentRef>();

  const handleClickReply = () => {
    setShowReply(prev => !prev || editorMode !== "reply");
    setEditorMode("reply");
  }

  const handleClickReplyAll = () => {
    setShowReply(prev => !prev || editorMode !== "replyAll");
    setEditorMode("replyAll");
  }

  const handleSendReply = async () => {
    setSendingReply(true);
    if (editorComponentRef.current) {
      const editorState = editorComponentRef.current.getEditorState();
      const context = editorState.getCurrentContent();
      const html = stateToHTML(context);

      let error: string | null = null;
      if (editorMode === "reply") {
        ({error} = await sendReply(
          selectedEmail.email,
          selectedEmail.provider,
          message,
          html
        ));
      } else if (editorMode === "replyAll") {
        ({error} = await sendReplyAll(
          selectedEmail.email,
          selectedEmail.provider,
          message,
          html
        ));
      }

      if (error) {
        console.log(error);
      } else {
        await partialSync(selectedEmail.email, selectedEmail.provider, {
          folderId: folderId,
        });
        setShowReply(false);
      }
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

      {showBody && (
        <div className="pb-4 px-4">
          {/* TODO: Verify that this is valid solution -> Assume google HTML is encoded and outlook is not */}
          <ShadowDom
            htmlString={cleanHtmlString(
              message.htmlData,
              selectedEmail.provider === "google"
            )}
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
          <div className="text-sm dark:text-zinc-400 text-slate-500 mb-2">
            {
              editorMode === "reply" ? `Write reply to ${message.from}` :
              editorMode === "replyAll" ? `Write reply to all` :
              "Error"
            }
          </div>
          <EmailEditor editorRef={editorRef} ref={editorComponentRef} />
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
