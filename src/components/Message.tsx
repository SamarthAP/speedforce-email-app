import { createRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import { IMessage } from "../lib/db";
import { cleanHtmlString, getGoogleMessageHeader } from "../lib/util";
import ShadowDom from "./ShadowDom";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { Editor } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { partialSync, sendReply } from "../lib/sync";
import { useEmailPageOutletContext } from "../pages/_emailPage";

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

  const replyRef = createRef<HTMLDivElement>();
  const editorRef = createRef<Editor>();
  const editorComponentRef = createRef<EditorComponentRef>();

  const handleSendReply = async () => {
    setSendingReply(true);
    if (editorComponentRef.current) {
      const editorState = editorComponentRef.current.getEditorState();
      const context = editorState.getCurrentContent();
      const html = stateToHTML(context);

      const { data, error } = await sendReply(selectedEmail.email, selectedEmail.provider, message, html);

      if (error || !data) {
        console.log(error);
      } else {
        await partialSync(selectedEmail.email, selectedEmail.provider, { folderId: folderId });
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
            <ArrowUturnLeftIcon
              onClick={(e) => {
                e.stopPropagation();
                setShowReply((prev) => !prev);
              }}
              className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
            />
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
      {showReply && (
        <div
          className="p-4 border-t border-t-slate-200 dark:border-t-zinc-700"
          ref={replyRef}
        >
          <div className="text-sm dark:text-zinc-400 text-slate-500 mb-2">
            Write a reply
          </div>
          <EmailEditor editorRef={editorRef} ref={editorComponentRef} />
          <button
            onClick={() => void handleSendReply()}
            disabled={sendingReply}
            className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
