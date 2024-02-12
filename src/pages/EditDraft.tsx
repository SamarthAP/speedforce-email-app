import { useCallback, useEffect, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import { ISelectedEmail, db } from "../lib/db";
import { useNavigate, useParams } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import TiptapEditor from "../components/Editors/TiptapEditor";
import { dLog } from "../lib/noProd";
import { NewAttachment } from "../api/model/users.attachment";
import {
  deleteThread,
  sendEmail,
  sendEmailWithAttachments,
  updateDraft,
} from "../lib/sync";
import toast from "react-hot-toast";
import { SendDraftRequestType } from "./ComposeMessage";
import { deleteDexieThread } from "../lib/util";

interface EditDraftProps {
  selectedEmail: ISelectedEmail;
}

export function EditDraft({ selectedEmail }: EditDraftProps) {
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [contentHtml, setContentHtml] = useState("");

  const navigate = useNavigate();
  const { threadId } = useParams();

  const setToAndSaveDraft = (emails: string[]) => {
    setTo(emails);
    void saveDraft({ to: emails });
  };

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
  }, [navigate]);

  const loadDraft = async (threadId: string) => {
    const thread = await db.emailThreads.get(threadId);
    const message = await db.messages
      .where("threadId")
      .equals(threadId)
      .first();

    if (thread && message && message.id) {
      setTo(message.toRecipients.filter((recipient) => recipient !== ""));
      setSubject(thread.subject || "");
      setContentHtml(message.htmlData || "");
    } else {
      dLog("Unable to load thread");
      navigate(-1);
    }
  };

  useEffect(() => {
    if (threadId) {
      void loadDraft(threadId);
    } else {
      dLog("Unable to load threadId");
      navigate(-1);
    }
  }, [threadId]);

  const saveDraft = useCallback(
    async (request: SendDraftRequestType) => {
      console.log(
        `saving draft: \n  to: ${request.to || to.join(",")}\n  subject: ${
          request.subject || subject
        }\n  content: ${request.content || contentHtml} \n  attachments: ${(
          request.attachments || attachments
        )
          .map((x) => x.filename)
          .join(",")}`
      );

      const message = await db.messages
        .where("threadId")
        .equals(threadId || "")
        .first();

      if (!message || !message.id) {
        return { error: "No message found" };
      }

      const { data, error } = await updateDraft(
        selectedEmail.email,
        selectedEmail.provider,
        message.id,
        request.to || to,
        request.subject || subject,
        request.content || contentHtml
        // request.attachments || attachments
      );

      if (error || !data) {
        dLog(error);
        return { error };
      }

      return { error: null };
    },
    [
      selectedEmail.email,
      selectedEmail.provider,
      subject,
      to,
      contentHtml,
      threadId,
      attachments,
    ]
  );

  // content is passed in as live data from editor as it is only saved when the user stops typing for 5 seconds
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
      if (threadId) {
        await deleteThread(
          selectedEmail.email,
          selectedEmail.provider,
          threadId,
          false
        );

        await deleteDexieThread(threadId);
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

      if (threadId) {
        await deleteThread(
          selectedEmail.email,
          selectedEmail.provider,
          threadId,
          false
        );

        await deleteDexieThread(threadId);
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
                void saveDraft({
                  to,
                  subject,
                  content: contentHtml,
                  attachments,
                });
                navigate(-1);
              }}
            >
              <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
              <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
                Back
              </p>
            </div>
          </div>
          <div className="dark:text-white p-4 w-full">Edit Draft</div>
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
                  value={subject}
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
                  <TiptapEditor
                    canSendEmail={to.length > 0}
                    initialContent={contentHtml}
                    attachments={attachments}
                    setAttachments={setAttachments}
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