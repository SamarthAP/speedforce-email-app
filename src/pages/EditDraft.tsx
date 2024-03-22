import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import {
  ArrowSmallLeftIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import { ISelectedEmail, db } from "../lib/db";
import { useNavigate, useParams } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import TiptapEditor, {
  TipTapEditorHandle,
} from "../components/Editors/TiptapEditor";
import { dLog } from "../lib/noProd";
import { NewAttachment } from "../api/model/users.attachment";
import { deleteDraft, sendEmail, sendEmailWithAttachments } from "../lib/sync";
import toast from "react-hot-toast";
import { deleteDexieThread, getSnippetFromHtml } from "../lib/util";
import SimpleButton from "../components/SimpleButton";
import { SharedDraftModal } from "../components/modals/ShareDraftModal";
import { getSharedDraft, saveSharedDraft } from "../api/sharedDrafts";
import { KeyPressProvider } from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import CommandBar from "../components/CommandBar";
import TooltipPopover from "../components/TooltipPopover";
import { useTooltip } from "../components/UseTooltip";
import CommentsChain from "../components/SharedDrafts/CommentsChain";
import { useQuery } from "react-query";
import { handleUpdateDraft } from "../lib/asyncHelpers";

interface EditDraftProps {
  selectedEmail: ISelectedEmail;
}

export function EditDraft({ selectedEmail }: EditDraftProps) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [snippet, setSnippet] = useState("");
  const [date, setDate] = useState(0);
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);
  const [shareModalIsOpen, setShareeModalIsOpen] = useState(false);
  const [messagePanelIsOpen, setMessagePanelIsOpen] = useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const editorRef = useRef<TipTapEditorHandle>(null);

  const navigate = useNavigate();
  const { threadId } = useParams();

  const setToAndSaveDraft = (emails: string[]) => {
    setTo(emails);
    void saveDraft(editorRef.current?.getHTML() || "");
  };

  const setCcAndSaveDraft = (emails: string[]) => {
    setCc(emails);
    void saveDraft(editorRef.current?.getHTML() || "");
  };

  const setBccAndSaveDraft = (emails: string[]) => {
    setBcc(emails);
    void saveDraft(editorRef.current?.getHTML() || "");
  };

  const { data, isLoading, refetch } = useQuery(
    ["sharedDraftEditor", { threadId }],
    async () => {
      if (!threadId) return;

      const { data, error } = await getSharedDraft(
        threadId,
        selectedEmail.email
      );
      if (error) {
        return null;
      }

      return data;
    }
  );

  useEffect(() => {
    if (!shareModalIsOpen) {
      // Refetch when share modal is closed
      void refetch();
    }
  }, [shareModalIsOpen, refetch]);

  const saveDraft = useCallback(
    async (html: string) => {
      if (!threadId) return { error: "No thread id" };
      const message = await db.messages
        .where("threadId")
        .equals(threadId)
        .first();

      if (!message || !message.id) {
        return { error: "No message found" };
      }

      // The save endpoint for outlook expects the message id, whereas the save endpoint for gmail expects the draft id
      // For simplicity sake, for shared drafts we will always use the message id
      const draftIdToUpdate =
        selectedEmail.provider === "google" ? threadId : message.id;

      await handleUpdateDraft(
        selectedEmail.email,
        selectedEmail.provider,
        draftIdToUpdate,
        to,
        cc,
        bcc,
        subject,
        html
      );

      const newSnippet = await getSnippetFromHtml(html);
      await saveSharedDraft(selectedEmail.email, {
        id: threadId,
        to,
        cc,
        bcc,
        subject,
        html,
        snippet: newSnippet,
        date: new Date().getTime(),
      });

      return { error: null };
    },
    [
      selectedEmail.email,
      selectedEmail.provider,
      subject,
      to,
      cc,
      bcc,
      threadId,
    ]
  );

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  // content is passed in as live data from editor as it is only saved when the user stops typing for 5 seconds
  const handleSendEmail = useCallback(async () => {
    if (!threadId) return;

    const html = editorRef.current?.getHTML() || "";
    setSendingEmail(true);
    let error: string | null = null;

    if (attachments.length > 0) {
      // send with attachments
      ({ error } = await sendEmailWithAttachments(
        selectedEmail.email,
        selectedEmail.provider,
        threadId,
        to,
        cc,
        bcc,
        subject,
        html,
        attachments
      ));
    } else {
      // send without attachments
      ({ error } = await sendEmail(
        selectedEmail.email,
        selectedEmail.provider,
        threadId,
        to,
        cc,
        bcc,
        subject,
        html
      ));
    }

    // If send fails, try save draft and return
    if (error) {
      await saveDraft(editorRef.current?.getHTML() || "");
      toast.error("Error sending email");
      return setSendingEmail(false);
    }

    if (threadId) {
      await deleteDraft(selectedEmail.email, selectedEmail.provider, threadId);
      await deleteDexieThread(threadId);
    }

    toast.success("Email sent");
    navigate(-1);
  }, [
    attachments,
    bcc,
    cc,
    navigate,
    saveDraft,
    selectedEmail.email,
    selectedEmail.provider,
    subject,
    threadId,
    to,
  ]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !commandBarIsOpen) {
        if (shareModalIsOpen) {
          setShareeModalIsOpen(false);
        } else {
          void saveDraft(editorRef.current?.getHTML() || "");
          navigate(-1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, shareModalIsOpen, saveDraft, commandBarIsOpen]);

  useEffect(() => {
    const loadDraft = async (threadId: string) => {
      const thread = await db.emailThreads.get(threadId);
      const messages = await db.messages
        .where("threadId")
        .equals(threadId)
        .toArray();

      const message = messages[0];

      if (thread && message && message.id) {
        setTo(message.toRecipients.filter((recipient) => recipient !== ""));
        setSubject(thread.subject || "");
        setInitialContent(message.htmlData || "");
        setSnippet(thread.snippet || "");
        setDate(thread.date || 0);
      } else {
        dLog("Unable to load thread");
        navigate(-1);
      }
    };

    if (threadId) {
      void loadDraft(threadId);
    } else {
      dLog("Unable to load threadId");
      navigate(-1);
    }
  }, [threadId, navigate]);

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
                      void saveDraft(editorRef.current?.getHTML() || "");
                      navigate(-1);
                    }}
                  >
                    <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
                    <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
                      Back
                    </p>
                  </div>
                </div>
                <span className="flex flex-row items-start justify-between px-4">
                  <div className="dark:text-white py-4 w-full">Edit Draft</div>
                  <div className="flex flex-row items-center space-x-2">
                    {!isLoading && data && data.id ? (
                      <button
                        className="p-2 mt-2 hover:bg-slate-200 dark:hover:bg-zinc-600 rounded-full"
                        onMouseEnter={(event) => {
                          handleShowTooltip(event, "Comments");
                        }}
                        onMouseLeave={handleHideTooltip}
                        onClick={() => setMessagePanelIsOpen((val) => !val)}
                      >
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 shrink-0 dark:text-zinc-300 text-black" />
                      </button>
                    ) : null}
                    <SimpleButton
                      text="Share"
                      loading={false}
                      onClick={() => setShareeModalIsOpen(true)}
                    />
                  </div>
                </span>
                <div className="h-full w-full flex flex-row">
                  <div className="h-full w-full flex flex-col space-y-2 pt-2 px-4 pb-4 mb-10 overflow-y-scroll hide-scroll">
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
                      <div className="flex py-2 border-b border-b-slate-200 dark:border-b-zinc-700">
                        {/* Input */}
                        <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
                          Subject
                        </div>
                        <input
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          onBlur={() =>
                            void saveDraft(editorRef.current?.getHTML() || "")
                          }
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
                          <TiptapEditor
                            ref={editorRef}
                            canSendEmail={
                              to.length > 0 || cc.length > 0 || bcc.length > 0
                            }
                            initialContent={initialContent}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            sendingEmail={sendingEmail}
                            sendEmail={handleSendEmail}
                            // setContent={setContentHtml}
                            saveDraft={saveDraft}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CommentsChain
                    threadId={threadId || ""}
                    editMode={true}
                    selectedEmail={selectedEmail}
                    visible={messagePanelIsOpen}
                  />
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
      <SharedDraftModal
        selectedEmail={selectedEmail}
        draftId={threadId || ""}
        to={to}
        cc={cc}
        bcc={bcc}
        subject={subject}
        snippet={snippet}
        date={date}
        html={initialContent}
        isDialogOpen={shareModalIsOpen}
        setIsDialogOpen={setShareeModalIsOpen}
      />
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
