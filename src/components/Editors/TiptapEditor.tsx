import { useEditor, EditorContent } from "@tiptap/react";
import TiptapMenuBar from "./TipTapEditorMenu";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import StrikeThrough from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import FontSize from "tiptap-extension-font-size";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImagePlugin from "./ImagePlugin";
import SimpleButton from "../SimpleButton";
import { useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/util";
import { dLog } from "../../lib/noProd";
import { ISelectedEmail } from "../../lib/db";
import { sendEmail, sendEmailWithAttachments } from "../../lib/sync";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// define your extension array
const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Write something..." }),
  Underline,
  StrikeThrough,
  Text,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  FontFamily,
  FontSize,
  OrderedList,
  BulletList,
  ListItem,
  Link.configure({
    HTMLAttributes: {
      target: "_blank",
      class: "text-blue-500 underline hover:text-blue-700",
    },
  }),
  ImagePlugin,
];

const content = "";

export interface NewAttachment {
  mimeType: string;
  filename: string;
  data: string;
  size: number;
}

interface TiptapProps {
  selectedEmail: ISelectedEmail;
  to: string[];
  subject: string;
}

export default function Tiptap({ selectedEmail, to, subject }: TiptapProps) {
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions,
    content,
  });

  if (!editor) return null;

  // Add addAttachments functionality
  async function addAttachments() {
    const attachments = await window.electron.ipcRenderer.invoke(
      "add-attachments"
    );

    setAttachments((prev) => [...prev, ...attachments]);
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const html = editor.getHTML();

    if (attachments.length > 0) {
      const { error } = await sendEmailWithAttachments(
        selectedEmail.email,
        selectedEmail.provider,
        to.join(","),
        subject,
        html,
        attachments
      );

      if (error) {
        dLog(error);
        toast.error("Error sending email");
        return setSendingEmail(false);
      }
    } else {
      const { error } = await sendEmail(
        selectedEmail.email,
        selectedEmail.provider,
        to.join(","),
        subject,
        html
      );

      if (error) {
        dLog(error);
        toast.error("Error sending email");
        return setSendingEmail(false);
      }
    }

    navigate(-1);
  };

  return (
    <div>
      <TiptapMenuBar editor={editor} addAttachments={addAttachments} />
      <div className="text-sm flex gap-x-1 overflow-scroll">
        {attachments.map((attachment, idx) => {
          return (
            <div
              key={idx}
              className={classNames(
                "inline-flex items-center h-[32px]",
                "rounded-md mt-2 px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
                "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600"
              )}
            >
              <span className="max-w-[128px] truncate cursor-default">
                {attachment.filename}
              </span>
              <button onClick={() => removeAttachment(idx)}>
                <XCircleIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          );
        })}
      </div>
      <EditorContent editor={editor} className="mt-4" />

      <div className="text-left mt-4 mb-2">
        <SimpleButton
          onClick={() => void handleSendEmail()}
          loading={sendingEmail}
          text="Send"
          width="w-16"
        />
      </div>
    </div>
  );
}
