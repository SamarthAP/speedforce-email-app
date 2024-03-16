import { useCallback, useEffect, useMemo, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import { ISelectedEmail } from "../lib/db";
import { useNavigate } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import Tiptap from "../components/Editors/TiptapEditor";
import {
  createDraft,
  sendEmail,
  sendEmailWithAttachments,
  updateDraft,
  deleteDraft,
} from "../lib/sync";
import { dLog } from "../lib/noProd";
import { NewAttachment } from "../api/model/users.attachment";
import toast from "react-hot-toast";
import { deleteDexieThread } from "../lib/util";
import { KeyPressProvider } from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import CommandBar from "../components/CommandBar";
import { newEvent } from "../api/emailActions";

interface ComposeMessageProps {
  selectedEmail: ISelectedEmail;
}

export interface SendDraftRequestType {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
  attachments?: NewAttachment[];
}

export function ComposeMessage({ selectedEmail }: ComposeMessageProps) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [contentHtml, setContentHtml] = useState(""); // TODO: Type this
  const [draft, setDraft] = useState<{
    id: string;
    threadId: string;
  }>({ id: "", threadId: "" }); // TODO: Type this
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);

  const navigate = useNavigate();

  const setToAndSaveDraft = (emails: string[]) => {
    setTo(emails);
    void saveDraft({ to: emails });
  };

  const setCcAndSaveDraft = (emails: string[]) => {
    setCc(emails);
    void saveDraft({ cc: emails });
  };

  const setBccAndSaveDraft = (emails: string[]) => {
    setBcc(emails);
    void saveDraft({ bcc: emails });
  };

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  const saveDraft = useCallback(
    async (request: SendDraftRequestType) => {
      if (draft.id && draft.threadId) {
        // Update draft
        const { data, error } = await updateDraft(
          selectedEmail.email,
          selectedEmail.provider,
          draft.id,
          request.to || to,
          request.cc || cc,
          request.bcc || bcc,
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
          request.cc || cc,
          request.bcc || bcc,
          request.subject || subject,
          request.content || contentHtml
          // request.attachments || attachments
        );

        if (error || !data) {
          dLog(error);
          return { error };
        }

        setDraft({
          id: data.id,
          threadId: data.threadId,
        });
      }

      return { error: null };
    },
    [
      draft,
      // attachments,
      contentHtml,
      subject,
      to,
      cc,
      bcc,
      selectedEmail.email,
      selectedEmail.provider,
    ]
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !commandBarIsOpen) {
        void saveDraft({});
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, saveDraft, commandBarIsOpen]);

  const handleSendEmail = async (content: string) => {
    setSendingEmail(true);
    if (attachments.length > 0) {
      // send with attachments
      const { error } = await sendEmailWithAttachments(
        selectedEmail.email,
        selectedEmail.provider,
        to,
        cc,
        bcc,
        subject,
        content,
        attachments
      );

      // If send fails, try save draft and return
      if (error) {
        await saveDraft({ content });
        toast.error("Error sending email");
        return setSendingEmail(false);
      } else {
        void newEvent("SEND_EMAIL");
      }

      // delete draft thread as there will be a new thread for the sent email
      if (draft.threadId) {
        await deleteDraft(
          selectedEmail.email,
          selectedEmail.provider,
          draft.threadId
        );

        await deleteDexieThread(draft.threadId);
      }
    } else {
      // send without attachments
      const { error } = await sendEmail(
        selectedEmail.email,
        selectedEmail.provider,
        to,
        cc,
        bcc,
        subject,
        content
      );

      // If send fails, try save draft and return
      if (error) {
        await saveDraft({ content });
        toast.error("Error sending email");
        return setSendingEmail(false);
      } else {
        void newEvent("SEND_EMAIL");
      }

      if (draft.id && draft.threadId) {
        await deleteDraft(
          selectedEmail.email,
          selectedEmail.provider,
          draft.id
        );

        await deleteDexieThread(draft.threadId);
      }
    }

    toast.success("Email sent");
    navigate(-1);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <KeyPressProvider>
        <CommandBarOpenContext.Provider value={commandBarContextValue}>
          <GoToPageHotkeys>
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
                        cc,
                        bcc,
                        subject,
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
                <div className="dark:text-white p-4 w-full">New Message</div>
                <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 mb-10 overflow-y-scroll hide-scroll">
                  <div className="border border-slate-200 dark:border-zinc-700 pt-1">
                    <EmailSelectorInput
                      selectedEmail={selectedEmail}
                      alignLabels="right"
                      toProps={{
                        text: "To",
                        emails: to,
                        setEmails: setToAndSaveDraft,
                      }}
                      ccProps={{
                        emails: cc,
                        setEmails: setCcAndSaveDraft,
                      }}
                      bccProps={{
                        emails: bcc,
                        setEmails: setBccAndSaveDraft,
                      }}
                    />
                    <div className="flex pb-2 pt-1 border-b border-b-slate-200 dark:border-b-zinc-700">
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
                        className="w-full block bg-transparent border-0 pl-5 pr-20 dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
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
                          canSendEmail={
                            to.length > 0 || cc.length > 0 || bcc.length > 0
                          }
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
            <ShortcutsFloater
              items={[
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN]],
                  description: "Move Down",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP]],
                  description: "Move Up",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
                  description: "Star",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT]],
                  description: "View Thread",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH]],
                  description: "Search",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE]],
                  description: "Compose",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s"],
                  isSequential: true,
                  description: "Go to Starred",
                },
              ]}
            />
            <CommandBar
              data={[]}
              // data={[
              //   {
              //     title: "Email Commands",
              //     commands: [
              //       {
              //         icon: StarIcon,
              //         description: "Star",
              //         action: () => {
              //           // star thread
              //           toast("Starred");
              //         },
              //         keybind: {
              //           keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
              //           isSequential: false,
              //         },
              //       },
              //     ],
              //   },
              // ]}
            />
          </GoToPageHotkeys>
        </CommandBarOpenContext.Provider>
      </KeyPressProvider>
    </div>
  );
}
