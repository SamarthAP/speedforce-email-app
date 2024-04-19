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
import { sendEmail, sendEmailWithAttachments } from "../lib/sync";
import toast from "react-hot-toast";
import SimpleButton from "../components/SimpleButton";
import { SharedDraftModal } from "../components/modals/ShareDraftModal";
import { loadParticipantsForDraft } from "../api/drafts";
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
import { handleDiscardDraft, handleUpdateDraft } from "../lib/asyncHelpers";
import { DraftStatusType } from "../api/model/users.draft";

interface EditDraftProps {
  selectedEmail: ISelectedEmail;
}

export function EditDraft({ selectedEmail }: EditDraftProps) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [initialData, setInitialData] = useState<{
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    html: string;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);
  const [shareModalIsOpen, setShareModalIsOpen] = useState(false);
  const [messagePanelIsOpen, setMessagePanelIsOpen] = useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const editorRef = useRef<TipTapEditorHandle>(null);

  const navigate = useNavigate();
  const { draftId } = useParams();

  const isDirty = useCallback(() => {
    if (!initialData) return false;
    const isHtmlDirty = editorRef.current?.isDirty() || false;

    return (
      to.toString() != initialData.to.toString() ||
      cc.toString() != initialData.cc.toString() ||
      bcc.toString() != initialData.bcc.toString() ||
      subject !== initialData.subject ||
      isHtmlDirty
    );
  }, [to, cc, bcc, subject, initialData]);

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
      if (!draftId) return { error: "No thread id" };
      if (!isDirty()) {
        // No changes, no need to save
        return { error: null };
      }

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

      return { error: null };
    },
    [draftId, isDirty]
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
      selectedEmail.email,
      selectedEmail.provider,
      to,
      cc,
      bcc,
      subject,
      saveDraft,
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

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  // content is passed in as live data from editor as it is only saved when the user stops typing for 5 seconds
  const handleSendEmail = useCallback(async () => {
    if (!draftId) return;

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
    toast.success("Email sent");
    navigate(-1);
  }, [
    attachments,
    bcc,
    cc,
    navigate,
    saveDraftWithHtml,
    selectedEmail.email,
    selectedEmail.provider,
    subject,
    draftId,
    to,
  ]);

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
  }, [navigate, shareModalIsOpen, saveDraftWithHtml, commandBarIsOpen]);

  useEffect(() => {
    const loadDraft = async (draftId: string) => {
      const draft = await db.drafts.get(draftId);
      if (draft) {
        setTo(draft.to.split(",").filter((recipient) => recipient !== ""));
        setCc(draft.cc.split(",").filter((recipient) => recipient !== ""));
        setBcc(draft.bcc.split(",").filter((recipient) => recipient !== ""));
        setSubject(draft.subject || "");
        setInitialContent(draft.html || "");
        setInitialData({
          to: draft.to.split(",").filter((recipient) => recipient !== ""),
          cc: draft.cc.split(",").filter((recipient) => recipient !== ""),
          bcc: draft.bcc.split(",").filter((recipient) => recipient !== ""),
          subject: draft.subject || "",
          html: draft.html || "",
        });
      } else {
        dLog("Unable to load thread");
        navigate(-1);
      }
    };

    if (draftId) {
      void loadDraft(draftId);
    } else {
      dLog("Unable to load draft");
      navigate(-1);
    }
  }, [draftId, navigate]);

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
                  <div className="dark:text-white py-4 w-full">Edit Draft</div>
                  <div className="flex flex-row items-center space-x-2">
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
                  </div>
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
                      <div className="flex py-2 border-b border-b-slate-200 dark:border-b-zinc-700">
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
                            saveDraft={saveDraftWithHtml}
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
        draftId={draftId || ""}
        sharedParticipants={sharedDraftParticipants || []}
        isDialogOpen={shareModalIsOpen}
        setIsDialogOpen={setShareModalIsOpen}
      />
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
