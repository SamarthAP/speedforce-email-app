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
import { useCallback, useEffect, useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/util";
import { EditLinkModal } from "../modals/EditLinkModal";
import { NewAttachment } from "../../api/model/users.attachment";
import { debounce } from "lodash";
import { SendDraftRequestType } from "../../pages/ComposeMessage";

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
  initialContent: string;
  attachments: NewAttachment[];
  setAttachments: (attachments: NewAttachment[]) => void;
  sendEmail: (content: string) => Promise<void>;
  setContent: (content: string) => void;
  saveDraft: (
    request: SendDraftRequestType
  ) => Promise<{ error: string | null }>;
  canSendEmail: boolean;
  sendingEmail: boolean;
}

export default function Tiptap({
  initialContent,
  attachments,
  setAttachments,
  sendEmail,
  setContent,
  saveDraft,
  canSendEmail,
  sendingEmail,
}: TiptapProps) {
  const [selectedLink, setSelectedLink] = useState<{
    displayText: string;
    link: string;
  } | null>(null);
  const [isEditLinkModalOpen, setIsEditLinkModalOpen] = useState(false);

  // debounced save draft function. save draft when user stops typing for 5 seconds
  const debouncedSaveDraft = useCallback(
    debounce((html) => {
      setContent(html);
      void saveDraft({ content: html });
    }, 5000),
    [saveDraft]
  );

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      // Call the debounced save draft function with the current HTML content of the editor
      debouncedSaveDraft(editor.getHTML());
    },
  });

  // Clean up the debounced save draft function so that it doesn't run after the component is unmounted
  useEffect(() => {
    return () => debouncedSaveDraft.cancel();
  }, [debouncedSaveDraft]);

  // Clicking link handler to open the edit link modal
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

  // For existing drafts, set the initial content
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  // Add addAttachments functionality
  async function addAttachments() {
    const newAttachments: NewAttachment[] =
      await window.electron.ipcRenderer.invoke("add-attachments");

    void saveDraft({ attachments: [...attachments, ...newAttachments] });
    setAttachments([...attachments, ...newAttachments]);
  }

  function removeAttachment(idx: number) {
    const newAttachments = attachments.filter((_, i) => i !== idx);
    void saveDraft({ attachments: newAttachments });
    setAttachments(newAttachments);
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
          onClick={() => {
            // void saveDraft({ content: editor.getHTML() });
            void sendEmail(editor.getHTML());
          }}
          loading={sendingEmail}
          text="Send"
          width="w-16"
          disabled={!canSendEmail}
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
