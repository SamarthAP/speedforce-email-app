import { useEffect, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import { ISelectedEmail } from "../lib/db";
import { useNavigate } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import Tiptap from "../components/Editors/TiptapEditor";

interface ComposeMessageProps {
  selectedEmail: ISelectedEmail;
}

export function ComposeMessage({ selectedEmail }: ComposeMessageProps) {
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const navigate = useNavigate();

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
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
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
          <div className="dark:text-white p-4 w-full">New Message</div>
          <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 mb-10 overflow-y-scroll hide-scroll">
            <div className="border border-slate-200 dark:border-zinc-700">
              <EmailSelectorInput
                text="To"
                selectedEmail={selectedEmail}
                emails={to}
                setEmails={setTo}
              />
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
                <div className="w-full pl-10 overflow-scroll hide-scroll">
                  {/* <EmailEditor editorRef={editorRef} ref={editorComponentRef} /> */}
                  <Tiptap
                    selectedEmail={selectedEmail}
                    to={to}
                    subject={subject}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
