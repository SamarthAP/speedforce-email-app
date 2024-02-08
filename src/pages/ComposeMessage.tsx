import { useCallback, useEffect, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import { ISelectedEmail, db } from "../lib/db";
import { useNavigate } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import Tiptap from "../components/Editors/TiptapEditor";
import {
  createDraft,
  deleteMessage,
  deleteThread,
  sendEmail,
  sendEmailWithAttachments,
  updateDraft,
} from "../lib/sync";
import { dLog } from "../lib/noProd";
import { NewAttachment } from "../api/model/users.attachment";
import toast from "react-hot-toast";
import { deleteDexieThread } from "../lib/util";

interface ComposeMessageProps {
  selectedEmail: ISelectedEmail;
}

export interface SendDraftRequestType {
  to?: string[];
  subject?: string;
  content?: string;
  attachments?: NewAttachment[];
}

export function ComposeMessage({ selectedEmail }: ComposeMessageProps) {
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [contentHtml, setContentHtml] = useState(""); // TODO: Type this

  const [draft, setDraft] = useState<{
    id: string;
    conversationId: string;
  }>({ id: "", conversationId: "" }); // TODO: Type this
  const navigate = useNavigate();

  const setToAndSaveDraft = (emails: string[]) => {
    setTo(emails);
    void saveDraft({ to: emails });
  };

  const saveDraft = useCallback(
    async (request: SendDraftRequestType) => {
      if (draft.id && draft.conversationId) {
        // Update draft
        const { data, error } = await updateDraft(
          selectedEmail.email,
          selectedEmail.provider,
          draft.id,
          request.to || to,
          request.subject || subject,
          request.content || contentHtml
          // request.attachments || attachments
        );

        if (error || !data) {
          dLog(error);
          return { error };
        }
      } else {
        // Create draft
        const { data, error } = await createDraft(
          selectedEmail.email,
          selectedEmail.provider,
          request.to || to,
          request.subject || subject,
          request.content || contentHtml
          // request.attachments || attachments
        );

        if (error || !data) {
          dLog(error);
          return { error };
        }

        setDraft(data);
      }

      return { error: null };
    },
    [
      draft,
      // attachments,
      contentHtml,
      subject,
      to,
      selectedEmail.email,
      selectedEmail.provider,
    ]
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void saveDraft({});
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, saveDraft]);

  const handleSendEmail = async (content: string) => {
    setSendingEmail(true);
    if (attachments.length > 0) {
      // send with attachments
      const { error } = await sendEmailWithAttachments(
        selectedEmail.email,
        selectedEmail.provider,
        to.join(","),
        subject,
        content,
        attachments
      );

      // If send fails, try save draft and return
      if (error) {
        await saveDraft({ content });
        toast.error("Error sending email");
        return setSendingEmail(false);
      }

      // delete draft thread as there will be a new thread for the sent email
      if (draft.conversationId) {
        await deleteThread(
          selectedEmail.email,
          selectedEmail.provider,
          draft.conversationId,
          false
        );

        await deleteDexieThread(draft.conversationId);
      }
    } else {
      // send without attachments
      const { error } = await sendEmail(
        selectedEmail.email,
        selectedEmail.provider,
        to.join(","),
        subject,
        content
      );

      // If send fails, try save draft and return
      if (error) {
        await saveDraft({ content });
        toast.error("Error sending email");
        return setSendingEmail(false);
      }

      if (draft.conversationId) {
        await deleteThread(
          selectedEmail.email,
          selectedEmail.provider,
          draft.conversationId,
          false
        );

        await deleteDexieThread(draft.conversationId);
      }
    }

    toast.success("Email sent");
    navigate(-1);
  };

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
                setEmails={setToAndSaveDraft}
              />
              <div className="flex pb-2 border-b border-b-slate-200 dark:border-b-zinc-700">
                {/* Input */}
                <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
                  Subject
                </div>
                <input
                  onChange={(event) => setSubject(event.target.value)}
                  onBlur={() => void saveDraft({ subject })}
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
                  <Tiptap
                    initialContent=""
                    attachments={attachments}
                    setAttachments={setAttachments}
                    canSendEmail={to.length > 0}
                    sendingEmail={sendingEmail}
                    sendEmail={handleSendEmail}
                    setContent={setContentHtml}
                    saveDraft={saveDraft}
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
