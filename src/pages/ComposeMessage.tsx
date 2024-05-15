import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import {
  ArrowDownOnSquareIcon,
  ArrowSmallLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { db, ISelectedEmail } from "../lib/db";
import { useNavigate } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import Tiptap, { TipTapEditorHandle } from "../components/Editors/TiptapEditor";
import { sendEmail, sendEmailWithAttachments } from "../lib/sync";
import { NewAttachment } from "../api/model/users.attachment";
import toast from "react-hot-toast";
import { KeyPressProvider } from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import CommandBar from "../components/CommandBar";
import { newEvent } from "../api/emailActions";
import {
  handleCreateDraft,
  handleDiscardDraft,
  handleUpdateDraft,
} from "../lib/asyncHelpers";
import { DraftReplyType, DraftStatusType } from "../api/model/users.draft";
import { useQuery } from "react-query";
import { loadParticipantsForDraft } from "../api/drafts";
import { useTooltip } from "../components/UseTooltip";
import TooltipPopover from "../components/TooltipPopover";
import { SharedDraftModal } from "../components/modals/ShareDraftModal";
import CommentsChain from "../components/SharedDrafts/CommentsChain";
import { CreateTemplateModal } from "../components/modals/CreateTemplateModal";
import { ImportTemplateModal } from "../components/modals/ImportTemplateModal";

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
  const [html, setHtml] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);
  const [shareModalIsOpen, setShareModalIsOpen] = useState(false);
  const [messagePanelIsOpen, setMessagePanelIsOpen] = useState(false);
  const [templateModalIsOpen, setTemplateModalIsOpen] = useState(false);
  const [importTemplateModalIsOpen, setImportTemplateModalIsOpen] =
    useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const editorRef = useRef<TipTapEditorHandle>(null);

  const navigate = useNavigate();

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  const { data: sharedDraftParticipants, refetch: refetchParticipants } =
    useQuery(["sharedDraftParticipants", { draftId }], async () => {
      if (!draftId) return;

      const { data, error } = await loadParticipantsForDraft(
        draftId,
        selectedEmail.email
      );

      if (error) {
        return null;
      }

      return data;
    });

  useEffect(() => {
    if (!shareModalIsOpen) {
      // Refetch when share modal is closed
      void refetchParticipants();
    }
  }, [shareModalIsOpen, refetchParticipants]);

  const createDraft = useCallback(async () => {
    // Create draft
    const { data, error } = await handleCreateDraft(
      selectedEmail.email,
      selectedEmail.provider,
      to,
      cc,
      bcc,
      subject,
      html,
      null,
      DraftReplyType.STANDALONE,
      null
    );

    if (error || !data) {
      return { error };
    }

    setDraftId(data);
  }, [selectedEmail, to, cc, bcc, subject, html]);

  const saveDraft = useCallback(
    async (
      email: string,
      provider: "google" | "outlook",
      to: string[],
      cc: string[],
      bcc: string[],
      subject: string,
      html: string
    ) => {
      if (!to.length && !cc.length && !bcc.length && !subject && !html)
        return { error: null };

      if (draftId) {
        // Async action handle saving draft
        await handleUpdateDraft(
          email,
          provider,
          draftId,
          to,
          cc,
          bcc,
          subject,
          html
        );
      } else {
        await createDraft();
      }

      return { error: null };
    },
    [draftId, createDraft]
  );

  // Use this function if there is no dependencies that changed other than the html content
  const saveDraftWithHtml = useCallback(
    async (html: string) => {
      const { error } = await saveDraft(
        selectedEmail.email,
        selectedEmail.provider,
        to,
        cc,
        bcc,
        subject,
        html
      );

      if (error) {
        toast.error("Error saving draft");
      }
      return { error };
    },
    [
      // attachments,
      subject,
      to,
      cc,
      bcc,
      saveDraft,
      selectedEmail.email,
      selectedEmail.provider,
    ]
  );

  // Save draft when any changes to recipients changes
  useEffect(() => {
    void saveDraft(
      selectedEmail.email,
      selectedEmail.provider,
      to,
      cc,
      bcc,
      subject,
      editorRef.current?.getHTML() || ""
    );
  }, [to, cc, bcc]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !commandBarIsOpen) {
        if (shareModalIsOpen) {
          setShareModalIsOpen(false);
        } else {
          void saveDraftWithHtml(editorRef.current?.getHTML() || "");
          navigate(-1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, saveDraftWithHtml, commandBarIsOpen]);

  const handleSendEmail = useCallback(async () => {
    const html = editorRef.current?.getHTML() || "";
    setSendingEmail(true);
    let error: string | null = null;

    if (attachments.length > 0) {
      // send with attachments
      ({ error } = await sendEmailWithAttachments(
        selectedEmail.email,
        selectedEmail.provider,
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
        to,
        cc,
        bcc,
        subject,
        html
      ));
    }

    // If send fails, try save draft and return
    if (error) {
      await saveDraftWithHtml(html);
      toast.error("Error sending email");
      return setSendingEmail(false);
    }

    await handleDiscardDraft(
      selectedEmail.email,
      draftId,
      DraftStatusType.SENT
    );
    void newEvent(selectedEmail.provider, "SEND_EMAIL", {
      from: "compose",
      countAttachments: attachments.length,
      countCc: cc.length,
      countBcc: bcc.length,
    });

    toast.success("Email sent");
    navigate(-1);
  }, [
    attachments,
    bcc,
    cc,
    draftId,
    saveDraftWithHtml,
    selectedEmail,
    subject,
    to,
    navigate,
  ]);

  const handleShowImportTemplateModal = useCallback(async () => {
    if (!draftId) {
      await createDraft();
    }

    setImportTemplateModalIsOpen(true);
  }, [createDraft, draftId]);

  useEffect(() => {
    if (importTemplateModalIsOpen) return;

    // Reload draft after import template
    const reloadDraft = async () => {
      const draft = await db.drafts.get(draftId);
      if (draft) {
        setTo(draft.to.split(",").filter((recipient) => recipient !== ""));
        setCc(draft.cc.split(",").filter((recipient) => recipient !== ""));
        setBcc(draft.bcc.split(",").filter((recipient) => recipient !== ""));
        setSubject(draft.subject || "");
        setHtml(draft.html || "");
      }
    };

    void reloadDraft();
  }, [draftId, importTemplateModalIsOpen]);

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
                      void saveDraftWithHtml(
                        editorRef.current?.getHTML() || ""
                      );
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
                  <div className="dark:text-white py-4 w-full">New Message</div>
                  <button
                    className="p-2 mt-2 hover:bg-slate-200 dark:hover:bg-zinc-600 rounded-full"
                    onMouseEnter={(event) => {
                      handleShowTooltip(event, "Import Template");
                    }}
                    onMouseLeave={handleHideTooltip}
                    onClick={() => void handleShowImportTemplateModal()}
                  >
                    <ArrowDownOnSquareIcon className="h-5 w-5 shrink-0 dark:text-zinc-300 text-black" />
                  </button>
                  {/* <div className="flex flex-row items-center space-x-2">
                    {draftId ? (
                      <>
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
                        <SimpleButton
                          text="Share"
                          loading={false}
                          onClick={() => setShareModalIsOpen(true)}
                        />
                      </>
                    ) : null}
                  </div> */}
                </span>
                <div className="h-full w-full flex flex-row mb-10 overflow-y-scroll hide-scroll">
                  <div className="h-full w-full flex flex-col space-y-2 pt-2 px-4 pb-4">
                    <div className="border border-slate-200 dark:border-zinc-700 pt-1">
                      <EmailSelectorInput
                        selectedEmail={selectedEmail}
                        alignLabels="right"
                        toProps={{
                          text: "To",
                          emails: to,
                          setEmails: setTo,
                        }}
                        ccProps={{
                          emails: cc,
                          setEmails: setCc,
                        }}
                        bccProps={{
                          emails: bcc,
                          setEmails: setBcc,
                        }}
                      />
                      <div className="flex pb-2 pt-1 border-b border-b-slate-200 dark:border-b-zinc-700">
                        {/* Input */}
                        <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end">
                          Subject
                        </div>
                        <input
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          onBlur={() =>
                            void saveDraftWithHtml(
                              editorRef.current?.getHTML() || ""
                            )
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
                          <Tiptap
                            ref={editorRef}
                            initialContent={html}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            canSendEmail={
                              to.length > 0 || cc.length > 0 || bcc.length > 0
                            }
                            sendingEmail={sendingEmail}
                            sendEmail={handleSendEmail}
                            saveDraft={saveDraftWithHtml}
                            templateProps={{
                              onCreateTemplate: () =>
                                setTemplateModalIsOpen(true),
                              onImportTemplate: () =>
                                void handleShowImportTemplateModal(),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CommentsChain
                    draftId={draftId || ""}
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
              data={[
                {
                  title: "Actions",
                  commands: [
                    {
                      description: "Create New Template",
                      icon: CodeBracketIcon,
                      action: () => setTemplateModalIsOpen(true),
                      keybind: {
                        keystrokes: [],
                        isSequential: false,
                      },
                    },
                    {
                      description: "Import From Template",
                      icon: ArrowDownOnSquareIcon,
                      action: () => {
                        // import from template
                        void handleShowImportTemplateModal();
                      },
                      keybind: {
                        keystrokes: [],
                        isSequential: false,
                      },
                    },
                  ],
                },
              ]} // data={[
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
        draftId={draftId || ""}
        sharedParticipants={sharedDraftParticipants || []}
        isDialogOpen={shareModalIsOpen}
        setIsDialogOpen={setShareModalIsOpen}
      />
      <CreateTemplateModal
        selectedEmail={selectedEmail}
        to={to.join(",")}
        cc={cc.join(",")}
        bcc={bcc.join(",")}
        subject={subject}
        html={editorRef.current?.getHTML() || ""}
        isDialogOpen={templateModalIsOpen}
        setIsDialogOpen={setTemplateModalIsOpen}
      />
      <ImportTemplateModal
        selectedEmail={selectedEmail}
        draftId={draftId || ""}
        isDialogOpen={importTemplateModalIsOpen}
        setIsDialogOpen={setImportTemplateModalIsOpen}
      />
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
