import { Editor } from "draft-js";
import { createRef, useEffect, useState } from "react";
import EmailEditor, { EditorComponentRef } from "./EmailEditor";
import { stateToHTML } from "draft-js-export-html";
import { getAccessToken } from "../api/accessToken";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { sendEmail } from "../api/gmail/users/threads";
import SimpleButton from "./SimpleButton";

interface WriteMessageProps {
  setWriteEmailMode: (writeEmailMode: boolean) => void;
}

export function WriteMessage({ setWriteEmailMode }: WriteMessageProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const editorRef = createRef<Editor>();
  const editorComponentRef = createRef<EditorComponentRef>();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");

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

  // TODO: use zod to validate email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    if (editorComponentRef.current) {
      const editorState = editorComponentRef.current.getEditorState();
      const context = editorState.getCurrentContent();
      const html = stateToHTML(context);

      const accessToken = await getAccessToken(selectedEmail.email);

      const { data, error } = await sendEmail(
        accessToken,
        selectedEmail.email,
        to,
        subject,
        html
      );

      if (error || !data) {
        console.log(error);
      } else {
        setWriteEmailMode(false);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="dark:text-white p-4 w-full">New Message</div>
      <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll">
        <div className="border border-slate-200 dark:border-zinc-700">
          <div className="flex py-2">
            {/* Input */}
            <div className="w-[128px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
              To
            </div>
            <input
              onChange={(event) => setTo(event.target.value)}
              type="email"
              name="to"
              id="to"
              className="w-full block bg-transparent border-0 pl-10 pr-20 dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
              placeholder="..."
            />
          </div>
          <div className="flex pb-2 border-b border-b-slate-200 dark:border-b-zinc-700">
            {/* Input */}
            <div className="w-[128px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
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
            <div className="w-[128px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex justify-end">
              Body
            </div>
            <div className="w-full pl-10">
              <EmailEditor editorRef={editorRef} ref={editorComponentRef} />
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
