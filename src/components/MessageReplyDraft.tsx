import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { IDraft, ISelectedEmail } from "../lib/db";
import { delay } from "../lib/util";

import { sendReply, syncThreadsById, sendReplyAll, forward } from "../lib/sync";
import toast from "react-hot-toast";
import { EmailSelectorInput } from "./EmailSelectorInput";
import TiptapEditor, { TipTapEditorHandle } from "./Editors/TiptapEditor";
import { NewAttachment } from "../api/model/users.attachment";
import { useNavigate } from "react-router-dom";
import { DraftReplyType, DraftStatusType } from "../api/model/users.draft";
import { handleDiscardDraft, handleUpdateDraft } from "../lib/asyncHelpers";

interface MessageDraftProps {
  selectedEmail: ISelectedEmail;
  draft: IDraft;
  threadId: string;
}

export interface MessageHandle {
  // focusCursor: () => void;
  saveOnExit: () => void;
}

const MessageDraft = forwardRef<MessageHandle, MessageDraftProps>(
  function MessageDraft(
    { selectedEmail, draft, threadId }: MessageDraftProps,
    ref: React.ForwardedRef<MessageHandle>
  ) {
    const [to, setTo] = useState<string[]>(draft.to.split(","));
    const [cc, setCc] = useState<string[]>(draft.cc.split(","));
    const [bcc, setBcc] = useState<string[]>(draft.bcc.split(","));
    const [attachments, setAttachments] = useState<NewAttachment[]>([]);
    const [sendingEmail, setSendingEmail] = useState(false);
    const editorRef = useRef<TipTapEditorHandle>(null);
    // const toCursoRef = useRef<HTMLDivElement>(null);
    // const tiptapRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useImperativeHandle(ref, () => ({
      // TODO: Implement
      // focusCursor: () => {
      //   if (draft.replyType === DraftReplyType.FORWARD) {
      //     if (tiptapRef.current) {
      //       tiptapRef.current.focus();
      //     }
      //   } else {
      //     if (toCursoRef.current) {
      //       toCursoRef.current.focus();
      //     }
      //   }
      // },

      saveOnExit: async () => {
        if (editorRef.current) {
          await saveDraft(
            selectedEmail.email,
            selectedEmail.provider,
            to,
            cc,
            bcc,
            draft.subject,
            editorRef.current?.getHTML() || ""
          );
        }
      },
    }));

    const isDirty = useCallback(() => {
      const isHtmlDirty = editorRef.current?.isDirty() || false;
      return (
        to.join(",") != draft.to ||
        cc.join(",") != draft.cc ||
        bcc.join(",") != draft.bcc ||
        isHtmlDirty
      );
    }, [to, cc, bcc, draft.to, draft.cc, draft.bcc]);

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
        if (!isDirty()) {
          // No changes, no need to save
          return { error: null };
        }

        // TODO: Fix saving early bug

        await handleUpdateDraft(
          email,
          provider,
          draft.id,
          to,
          cc,
          bcc,
          subject,
          html
        );

        return { error: null };
      },
      [isDirty, draft]
    );

    useEffect(() => {
      void saveDraft(
        selectedEmail.email,
        selectedEmail.provider,
        to,
        cc,
        bcc,
        draft.subject,
        editorRef.current?.getHTML() || ""
      );
    }, [to, cc, bcc]);

    const handleSendEmail = useCallback(async () => {
      setSendingEmail(true);
      let error: string | null = null;

      if (draft.replyType == DraftReplyType.REPLY) {
        ({ error } = await sendReply(
          selectedEmail.email,
          selectedEmail.provider,
          to.join(","),
          cc.join(","),
          bcc.join(","),
          draft.subject,
          editorRef.current?.getHTML() || "",
          draft.inReplyTo || "",
          draft.threadId || ""
        ));
      } else if (draft.replyType == DraftReplyType.REPLYALL) {
        ({ error } = await sendReplyAll(
          selectedEmail.email,
          selectedEmail.provider,
          to.join(","),
          cc.join(","),
          bcc.join(","),
          draft.subject,
          editorRef.current?.getHTML() || "",
          draft.inReplyTo || "",
          draft.threadId || ""
        ));
      } else if (draft.replyType == DraftReplyType.FORWARD) {
        ({ error } = await forward(
          selectedEmail.email,
          selectedEmail.provider,
          to.join(","),
          cc.join(","),
          bcc.join(","),
          draft.subject,
          draft.html,
          draft.inReplyTo || ""
        ));
      }

      if (error) {
        toast.error("Error sending email");
        return setSendingEmail(false);
      }

      // Weird behaviour here on outlook. When we resync immediately after sending the email, the sent email is returned as a draft
      // Later, it is returned as a message but with a different id
      // Grab new sent message for UI feedback of sent message
      if (selectedEmail.provider === "outlook") {
        await delay(1000);
      }

      await syncThreadsById(selectedEmail.email, selectedEmail.provider, [
        threadId,
      ]);

      await handleDiscardDraft(
        selectedEmail.email,
        draft.id,
        DraftStatusType.SENT
      );

      toast.success("Email sent");
      setSendingEmail(false);
      if (draft.replyType == DraftReplyType.FORWARD) {
        navigate(-1);
      }
    }, [
      bcc,
      cc,
      draft,
      navigate,
      selectedEmail.email,
      selectedEmail.provider,
      to,
      threadId,
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
              ref={editorRef}
              initialContent={draft.html || "<div></div>"}
              attachments={attachments}
              setAttachments={setAttachments}
              canSendEmail={to.length > 0 || cc.length > 0 || bcc.length > 0}
              sendEmail={handleSendEmail}
              sendingEmail={sendingEmail}
              saveDraft={async (html: string) => {
                // No debonuced save to avoid rerenders
                return { error: null };
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default MessageDraft;
