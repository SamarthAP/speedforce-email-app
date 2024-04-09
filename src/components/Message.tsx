import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import { db, IMessage, ISelectedEmail } from "../lib/db";
import {
  classNames,
  cleanHtmlString,
  getMessageHeader,
  listUnsubscribe,
} from "../lib/util";
import ShadowDom from "./ShadowDom";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import {
  sendEmailWithAttachments,
  sendDraft,
  sendEmail,
  deleteDraft,
  createDraftForReply,
  handleNewDraftsGoogle,
  handleNewThreadsOutlook,
  createDraftForReplyAll,
} from "../lib/sync";
import { AttachmentButton } from "./AttachmentButton";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import toast from "react-hot-toast";
import { EmailSelectorInput } from "./EmailSelectorInput";
import TiptapEditor, { TipTapEditorHandle } from "./Editors/TiptapEditor";
import { NewAttachment } from "../api/model/users.attachment";
import { dLog } from "../lib/noProd";
import { updateSharedDraftStatus } from "../api/sharedDrafts";
import { SharedDraftStatusType } from "../api/model/users.shared.draft";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../api/accessToken";
import { buildForwardedHTML } from "../api/gmail/helpers";
import { CreateDraftResponseDataType } from "../api/model/users.draft";

enum REPLY_MODES {
  REPLY = "reply",
  REPLY_ALL = "replyAll",
  FORWARD = "forward",
}

interface MessageProps {
  message: IMessage;
  key: string;
  selectedEmail: ISelectedEmail;
  isLast?: boolean;
  onCreateDraft: (draftId: string) => void;
}

export interface MessageHandle {
  focusTo: () => void;
}
const Message = forwardRef<MessageHandle, MessageProps>(function Message(
  { message, selectedEmail, isLast, onCreateDraft }: MessageProps,
  ref: React.ForwardedRef<MessageHandle>
) {
  // if isLast is true, then show the body and scroll to the bottom of the message
  const [showBody, setShowBody] = useState(isLast || false);
  // const [showReply, setShowReply] = useState(false);
  const [showImages, setShowImages] = useState(true);
  // const [sendingReply, setSendingReply] = useState(false);
  const [unsubscribingFromList, setUnsubscribingFromList] = useState(false);
  // const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  // const [editorMode, setEditorMode] = useState<
  //   "reply" | "replyAll" | "forward" | "none"
  // >("none");
  // const [forwardTo, setForwardTo] = useState<string[]>([]);
  // const [forwardToCc, setForwardToCc] = useState<string[]>([]);
  // const [forwardToBcc, setForwardToBcc] = useState<string[]>([]);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  // const replyRef = createRef<HTMLDivElement>();
  const listUnsubscribeHeader = getMessageHeader(
    message.headers,
    "List-Unsubscribe"
  );

  useImperativeHandle(ref, () => ({
    focusTo: () => {
      // TODO: focus on the draft input. For FWD use case, focus on the email selector input
      // Need to probably segregate message and draft components
      void 0;
    },
  }));

  const handleUnsubscribe = () => {
    if (!listUnsubscribeHeader) return;

    setUnsubscribingFromList(true);
    void listUnsubscribe(
      listUnsubscribeHeader,
      selectedEmail.email,
      selectedEmail.provider
    ).then(() => {
      setUnsubscribingFromList(false);
    });
  };

  const createReplyDraft = async (
    message: IMessage,
    replyMode: REPLY_MODES
  ) => {
    let data: CreateDraftResponseDataType | null = null;
    let error: string | null = null;

    if (replyMode === REPLY_MODES.REPLY) {
      const to =
        getMessageHeader(message.headers, "From").match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
        )?.[0] ||
        getMessageHeader(message.headers, "To") ||
        "";

      ({ data, error } = await createDraftForReply(
        selectedEmail.email,
        selectedEmail.provider,
        [to],
        [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        "",
        getMessageHeader(message.headers, "Message-ID"),
        message.threadId,
        message.id
      ));
    } else if (replyMode === REPLY_MODES.REPLY_ALL) {
      const to =
        getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g) || [];
      const from =
        getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g) ||
        [];

      ({ data, error } = await createDraftForReplyAll(
        selectedEmail.email,
        selectedEmail.provider,
        [...from, ...to].filter((email) => email !== selectedEmail.email),
        getMessageHeader(message.headers, "Cc").match(/[\w.-]+@[\w.-]+/g) || [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        "",
        getMessageHeader(message.headers, "Message-ID"),
        message.threadId,
        message.id
      ));
    } else {
      const fwdHtml =
        selectedEmail.provider === "google"
          ? await buildForwardedHTML(message)
          : "";

      ({ data, error } = await createDraftForReply(
        selectedEmail.email,
        selectedEmail.provider,
        [],
        [],
        [],
        getMessageHeader(message.headers, "Subject") || "",
        fwdHtml,
        getMessageHeader(message.headers, "Message-ID"),
        message.threadId,
        message.id
      ));
    }

    if (error || !data || !data.id || !data.threadId) {
      dLog(error);
      return { error };
    }

    // Add to dexie
    const accessToken = await getAccessToken(selectedEmail.email);
    if (selectedEmail.provider === "google") {
      await handleNewDraftsGoogle(
        accessToken,
        selectedEmail.email,
        [data.id],
        true
      );
    } else if (selectedEmail.provider === "outlook") {
      await handleNewThreadsOutlook(
        accessToken,
        selectedEmail.email,
        [data.threadId],
        []
      );
    }

    // Send new draft message id to parent component
    onCreateDraft(data.messageId);
  };

  if (message.draftId) {
    return <MessageDraft selectedEmail={selectedEmail} message={message} />;
  }

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
            <>
              {/* <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Star");
                }}
                onMouseLeave={handleHideTooltip}
              >
                {message.labelIds.includes("STARRED") ? (
                  <StarIconSolid
                    onClick={(e) => {
                      e.stopPropagation();
                      // star the message, not thread.
                    }}
                    className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                  />
                ) : (
                  <StarIconOutline
                    onClick={(e) => {
                      e.stopPropagation();
                      // star the message, not thread.
                    }}
                    className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                  />
                )}
              </div> */}
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Reply");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <ArrowUturnLeftIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, REPLY_MODES.REPLY);
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </div>
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Reply All");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <svg
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, REPLY_MODES.REPLY_ALL);
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3 M13 15L7 9m0 0l6-6"
                  ></path>
                </svg>
              </div>
              <div
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Forward");
                }}
                onMouseLeave={handleHideTooltip}
              >
                <ArrowUturnRightIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    void createReplyDraft(message, REPLY_MODES.FORWARD);
                  }}
                  className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2"
                />
              </div>
              <TooltipPopover
                message={tooltipData.message}
                showTooltip={tooltipData.showTooltip}
                coords={tooltipData.coords}
              />
            </>
          )}
          <p className="dark:text-zinc-400 text-slate-500 text-sm">
            {dayjs(message.date).format("MMM D, YYYY h:mm A")}
          </p>
        </div>
      </div>

      <div className="flex gap-x-1 px-4 pb-4">
        <button
          className={classNames(
            "inline-flex items-center ",
            "rounded-md px-2 py-1",
            "ring-1 ring-inset",
            "text-xs font-medium",
            "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
          )}
          onClick={() => setShowImages((old) => !old)}
        >
          {showImages ? "Hide Images" : "Show Images"}
        </button>
        {listUnsubscribeHeader && (
          <button
            className={classNames(
              "inline-flex items-center ",
              "rounded-md px-2 py-1",
              "ring-1 ring-inset",
              "text-xs font-medium",
              "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
            )}
            disabled={unsubscribingFromList}
            onClick={handleUnsubscribe}
          >
            Unsubscribe
          </button>
        )}
      </div>

      {showBody && (
        <div className="pb-4 px-4">
          {/* TODO: Verify that this is valid solution -> Assume google HTML is encoded and outlook is not */}
          <ShadowDom
            htmlString={cleanHtmlString(message.htmlData)}
            showImages={showImages}
          />
        </div>
      )}

      {
        <div className="p-4 flex gap-x-1 overflow-scroll hide-scroll">
          {message.attachments.map((attachment, idx) => (
            <AttachmentButton
              key={idx}
              attachment={attachment}
              messageId={message.id}
              selectedEmail={selectedEmail}
            />
          ))}
        </div>
      }
    </div>
  );
});

interface MessageDraftProps {
  selectedEmail: ISelectedEmail;
  message: IMessage;
}

const MessageDraft = ({ selectedEmail, message }: MessageDraftProps) => {
  const [to, setTo] = useState<string[]>(message.toRecipients);
  const [cc, setCc] = useState<string[]>(message.ccRecipients);
  const [bcc, setBcc] = useState<string[]>(message.bccRecipients);
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const editorRef = useRef<TipTapEditorHandle>(null);
  const navigate = useNavigate();

  // const isDirty = useCallback(() => {
  //   const isHtmlDirty = editorRef.current?.isDirty() || false;

  //   return (
  //     to.toString() != message.toRecipients.toString() ||
  //     cc.toString() != message.ccRecipients.toString() ||
  //     bcc.toString() != message.bccRecipients.toString() ||
  //     isHtmlDirty
  //   );
  // }, [
  //   to,
  //   cc,
  //   bcc,
  //   message.toRecipients,
  //   message.ccRecipients,
  //   message.bccRecipients,
  // ]);

  // const saveDraft = useCallback(
  //   async (
  //     email: string,
  //     provider: "google" | "outlook",
  //     to: string[],
  //     cc: string[],
  //     bcc: string[],
  //     subject: string,
  //     html: string
  //   ) => {
  //     if (!isDirty()) {
  //       // No changes, no need to save
  //       return { error: null };
  //     }

  //     // The save endpoint for outlook expects the message id, whereas the save endpoint for gmail expects the draft id
  //     // For simplicity sake, for shared drafts we will always use the message id
  //     const draftIdToUpdate =
  //       provider === "google" ? message.draftId : message.id;

  //     await handleUpdateDraft(
  //       email,
  //       provider,
  //       draftIdToUpdate,
  //       to,
  //       cc,
  //       bcc,
  //       subject,
  //       html
  //     );

  //     const newSnippet = await getSnippetFromHtml(html);
  //     await saveSharedDraft(email, {
  //       id: threadId,
  //       to,
  //       cc,
  //       bcc,
  //       subject,
  //       html,
  //       snippet: newSnippet,
  //       date: new Date().getTime(),
  //     });

  //     return { error: null };
  //   },
  //   [threadId, isDirty]
  // );
  const getReplyHeadersKeyValues = (message: IMessage) => {
    const headers: { key: string; value: string }[] = [];

    const inReplyTo = getMessageHeader(message.headers, "In-Reply-To");
    if (inReplyTo) {
      headers.push({ key: "In-Reply-To", value: inReplyTo });
    }

    const references = getMessageHeader(message.headers, "References");
    if (references) {
      headers.push({ key: "References", value: references });
    }

    return headers;
  };

  const handleSendEmail = useCallback(async () => {
    // if (!threadId) return;

    const html = editorRef.current?.getHTML() || "";
    const subject = getMessageHeader(message.headers, "Subject") || "";
    setSendingEmail(true);
    let error: string | null = null;
    const replyHeaders = getReplyHeadersKeyValues(message);

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
        html,
        replyHeaders
      ));
    }

    // If send fails, try save draft and return
    if (error) {
      // await saveDraftWithHtml(html);
      toast.error("Error sending email");
      return setSendingEmail(false);
    }

    await updateSharedDraftStatus(
      message.threadId,
      selectedEmail.email,
      SharedDraftStatusType.SENT
    );

    await deleteDraft(
      selectedEmail.email,
      selectedEmail.provider,
      message.draftId || ""
    );
    await db.drafts.delete(message.draftId || "");

    toast.success("Email sent");
    navigate(-1);
  }, [
    attachments,
    bcc,
    cc,
    selectedEmail.email,
    selectedEmail.provider,
    to,
    message,
    navigate,
  ]);

  return (
    <div className="w-full h-auto flex flex-col border border-slate-200 dark:border-zinc-700">
      <div className="text-sm dark:text-zinc-400 text-slate-500 p-4 mb-0.5">
        <EmailSelectorInput
          selectedEmail={selectedEmail}
          alignLabels="left"
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
        <div className="flex py-2">
          <TiptapEditor
            initialContent={message.htmlData}
            attachments={attachments}
            setAttachments={setAttachments}
            canSendEmail={to.length > 0 || cc.length > 0 || bcc.length > 0}
            sendEmail={handleSendEmail}
            sendingEmail={sendingEmail}
            saveDraft={async () => {
              return { error: null };
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Message;
