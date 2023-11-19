import { Editor } from "draft-js";
import { createRef, useEffect, useState } from "react";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { stateToHTML } from "draft-js-export-html";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { sendEmail, sendEmailWithAttachments } from "../lib/sync";
import SimpleButton from "./SimpleButton";
import { dLog } from "../lib/noProd";
import { PaperClipIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { classNames } from "../lib/util";
import toast from "react-hot-toast";
import { EmailSelectorInput } from "./EmailSelectorInput";

interface WriteMessageProps {
  setWriteEmailMode: (writeEmailMode: boolean) => void;
}

export interface NewAttachment {
  mimeType: string;
  filename: string;
  data: string;
  size: number;
}

export function WriteMessage({ setWriteEmailMode }: WriteMessageProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const editorRef = createRef<Editor>();
  const editorComponentRef = createRef<EditorComponentRef>();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWriteEmailMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [setWriteEmailMode]);

  async function addAttachments() {
    const attachments = await window.electron.ipcRenderer.invoke(
      "add-attachments"
    );

    setAttachments((prev) => [...prev, ...attachments]);
  }

  // TODO: use zod to validate email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    if (editorComponentRef.current) {
      const editorState = editorComponentRef.current.getEditorState();
      const context = editorState.getCurrentContent();
      const html = stateToHTML(context);

      if (attachments.length > 0) {
        const { error } = await sendEmailWithAttachments(
          selectedEmail.email,
          selectedEmail.provider,
          to.join(","),
          subject,
          html,
          attachments
        );

        if (error) {
          dLog(error);
          toast.error("Error sending email");
          return setSendingEmail(false);
        }
      } else {
        const { error } = await sendEmail(
          selectedEmail.email,
          selectedEmail.provider,
          to.join(","),
          subject,
          html
        );

        if (error) {
          dLog(error);
          toast.error("Error sending email");
          return setSendingEmail(false);
        }
      }
    }
    setWriteEmailMode(false);
  };

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="dark:text-white p-4 w-full">New Message</div>
      <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll">
        <div className="border border-slate-200 dark:border-zinc-700">
          <EmailSelectorInput text="To" emails={to} setEmails={setTo} />
          <div className="flex pb-2 border-b border-b-slate-200 dark:border-b-zinc-700">
            {/* Input */}
            <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
              Subject
            </div>
            <input
              onChange={(event) => setSubject(event.target.value)}
              type="text"
              name="subject"
              id="subject"
              className="w-full block bg-transparent border-0 pl-10 pr-20 dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
              placeholder="..."
            />
          </div>
          <div className="flex py-2">
            {/* Input */}
            <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-start justify-end">
              Body
            </div>
            <div className="w-full pl-10">
              <EmailEditor editorRef={editorRef} ref={editorComponentRef} />
            </div>
          </div>
          <div className="flex py-2">
            <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
              <button onClick={() => void addAttachments()}>
                <PaperClipIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full pl-10 text-sm flex gap-x-1 overflow-scroll">
              {attachments.map((attachment, idx) => {
                return (
                  <div
                    key={idx}
                    className={classNames(
                      "inline-flex items-center h-[32px]",
                      "rounded-md px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
                      "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600"
                    )}
                  >
                    <span className="max-w-[128px] truncate cursor-default">
                      {attachment.filename}
                    </span>
                    <button onClick={() => removeAttachment(idx)}>
                      <XCircleIcon className={classNames("w-4 h-4 ml-1")} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <SimpleButton
            onClick={() => void handleSendEmail()}
            loading={sendingEmail}
            text="Send"
            width="w-16"
          />
        </div>
      </div>
    </div>
  );
}
