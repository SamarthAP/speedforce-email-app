import { createRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import { cleanHtmlString } from "../lib/util";
import { IMessage } from "../lib/db";
import ShadowDom from "./ShadowDom";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import EmailEditor from "./EmailEditor";
import { Editor } from "draft-js";
import { useEmailPageOutletContext } from "../pages/_emailPage";

interface MessageProps {
  message: IMessage;
  key: string;
}

export default function Message({ message }: MessageProps) {
  const { selectedEmail } = useEmailPageOutletContext();

  const [showBody, setShowBody] = useState(true);
  const [showReply, setShowReply] = useState(false);

  const replyRef = createRef<HTMLDivElement>();
  const editorRef = createRef<Editor>();

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
          <ShadowDom htmlString={cleanHtmlString(message.htmlData, selectedEmail.provider === "google")} />
        </div>
      )}
      {showReply && (
        <div ref={replyRef}>
          <EmailEditor editorRef={editorRef} />
        </div>
      )}
    </div>
  );
}
