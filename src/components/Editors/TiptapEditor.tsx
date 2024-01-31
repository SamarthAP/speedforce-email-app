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
import { useEffect, useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/util";
import { dLog } from "../../lib/noProd";
import { ISelectedEmail } from "../../lib/db";
import { sendEmail, sendEmailWithAttachments } from "../../lib/sync";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { EditLinkModal } from "../modals/EditLinkModal";
import { NewAttachment } from "../../api/model/users.attachment";

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
    openOnClick: false,
  }),
  ImagePlugin,
];

const content = "";

interface TiptapProps {
  selectedEmail: ISelectedEmail;
  to: string[];
  subject: string;
}

export default function Tiptap({ selectedEmail, to, subject }: TiptapProps) {
  const [attachments, setAttachments] = useState<NewAttachment[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedLink, setSelectedLink] = useState<{
    displayText: string;
    link: string;
  } | null>(null);
  const [isEditLinkModalOpen, setIsEditLinkModalOpen] = useState(false);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions,
    content,
  });

  useEffect(() => {
    if (editor) {
      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === "A") {
          event.preventDefault();
          const href = target.getAttribute("href");
          const text = target.textContent;
          setSelectedLink({ displayText: text || "", link: href || "" });
          setIsEditLinkModalOpen(true);
        }
      };

      const editorEl = editor.view.dom;
      editorEl.addEventListener("click", handleClick);

      return () => {
        editorEl.removeEventListener("click", handleClick);
      };
    }
  }, [editor]);

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

  const editLink = (displayText: string | null, url: string) => {
    const { $from } = editor.state.selection;
    const linkMarkType = editor.state.schema.marks.link;

    let startPos = $from.pos;
    let endPos = startPos;

    editor.state.doc.nodesBetween(
      startPos,
      editor.state.doc.content.size,
      (node, pos) => {
        if (
          node.isInline &&
          node.marks.some((mark) => mark.type === linkMarkType)
        ) {
          if (startPos > pos) {
            startPos = pos;
          }
          endPos = pos + node.nodeSize;
        }
      }
    );

    // Selection not inside a link
    if (startPos === endPos) return;

    // Create a new text node with the link mark
    const newLinkNode = editor.schema.text(displayText || url, [
      linkMarkType.create({ href: url }),
    ]);

    // Create a transaction to replace the specified link
    const transaction = editor.state.tr.replaceWith(
      startPos,
      endPos,
      newLinkNode
    );

    // Dispatch the transaction
    editor.view.dispatch(transaction);
  };

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
      <div className="text-sm flex gap-x-1 overflow-scroll hide-scroll">
        {attachments.map((attachment, idx) => {
          return (
            <div
              key={idx}
              className={classNames(
                "inline-flex items-center h-[32px]",
                "rounded-md mt-2 px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
                "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300",
                sendingEmail ? "" : "hover:bg-slate-300 dark:hover:bg-zinc-600"
              )}
            >
              <span className="max-w-[128px] truncate cursor-default">
                {attachment.filename}
              </span>
              {!sendingEmail && (
                <button onClick={() => removeAttachment(idx)}>
                  <XCircleIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <EditorContent editor={editor} className="mt-4 dark:text-white" />

      <div className="text-left mt-4 mb-2">
        <SimpleButton
          onClick={() => void handleSendEmail()}
          loading={sendingEmail}
          text="Send"
          width="w-16"
          disabled={to.length === 0}
        />
      </div>
      <EditLinkModal
        initialTextToDisplay={selectedLink?.displayText || ""}
        initialUrl={selectedLink?.link || ""}
        isDialogOpen={isEditLinkModalOpen}
        setIsDialogOpen={setIsEditLinkModalOpen}
        editLink={editLink}
      />
    </div>
  );
}
