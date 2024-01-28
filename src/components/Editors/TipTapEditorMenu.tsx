import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import { classNames } from "../../lib/util";
import {
  BoldIcon,
  BulletListIcon,
  // HighlightColorIcon,
  ItalicIcon,
  NumberedListIcon,
  RedoIcon,
  // StrikeIcon,
  // TextColorIcon,
  UnderlineIcon,
  UndoIcon,
} from "./Assets";
import TooltipPopover from "../TooltipPopover";
import { useTooltip } from "../UseTooltip";
import { PaperClipIcon, LinkIcon } from "@heroicons/react/20/solid";
import { AddLinkModal } from "../modals/AddLinkModal";
import { useThemeContext } from "../../contexts/ThemeContext";

interface TiptapMenuBarProps {
  editor: Editor;
  addAttachments: () => Promise<void>;
}

export default function TiptapMenuBar({
  editor,
  addAttachments,
}: TiptapMenuBarProps) {
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const { theme, setTheme } = useThemeContext();

  // const changeFont = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const font = event.target.value;
  //   editor.chain().focus().setFontFamily(font).run();
  // };

  // const changeFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const size = e.target.value;
  //   editor.chain().focus().setFontSize(size).run();
  // };

  useEffect(() => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    setSelectedText(text);
  }, [editor.state.selection, editor.state.doc]);

  const addLink = (displayText: string | null, url: string) => {
    const { from, to, empty } = editor.state.selection;

    if (displayText) {
      if (empty) {
        // If displayText is specified and there is no selection, insert the displayText with the link
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${displayText}</a>`)
          .run();
      } else {
        // If displayText is specified and there is a selection, replace the selection with the displayText
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .setLink({ href: url })
          .insertContent(displayText)
          .run();
      }
    } else {
      if (empty) {
        // If displayText is not specified and there is no selection, insert the url as the displayText and link
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${url}</a>`)
          .run();
      } else {
        // If displayText is not specified and there is a selection, link the selection
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }
    }
  };

  if (!editor) return null;
  return (
    <span className="flex flex-row">
      <span className="flex flex-row items-center">
        <button
          // onClick={() => editor.commands.undo()}
          onClick={() => console.log(theme)}
          className={classNames(
            "p-1.5 h-full",
            theme === "light" ? "hover:bg-slate-200" : "hover:bg-zinc-700"
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Undo \u2318Z");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <UndoIcon
            className="w-4 h-4"
            fill={theme === "light" ? "#000" : "#fff"}
          />
        </button>
        <button
          onClick={() => editor.commands.redo()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light" ? "hover:bg-slate-200" : "hover:bg-zinc-700"
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Redo \u2318Y");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <RedoIcon
            className="w-4 h-4"
            fill={theme === "light" ? "#000" : "#fff"}
          />
        </button>
      </span>

      <span
        className={classNames(
          "flex flex-row items-center border-l ",
          theme === "light" ? "border-slate-200" : "border-zinc-700"
        )}
      >
        <button
          onClick={() => void addAttachments()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light" ? "hover:bg-slate-200" : "hover:bg-zinc-700"
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Add Attachments");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <PaperClipIcon
            className={classNames(
              "w-4 h-4",
              theme === "light" ? "text-black" : "text-white"
            )}
          />
        </button>
        <button
          onClick={() => setIsAddLinkModalOpen(true)}
          className={classNames(
            "p-1.5 h-full",
            theme === "light" ? "hover:bg-slate-200" : "hover:bg-zinc-700"
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Add External Link");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <LinkIcon
            className={classNames(
              "w-4 h-4 rotate-45",
              theme === "light" ? "text-black" : "text-white"
            )}
          />
        </button>
      </span>

      <span
        className={classNames(
          "flex flex-row items-center border-l ",
          theme === "light" ? "border-slate-200" : "border-zinc-700"
        )}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light"
              ? `hover:bg-slate-200 ${
                  editor.isActive("bold") && "bg-slate-200"
                }`
              : `hover:bg-zinc-700 ${editor.isActive("bold") && "bg-zinc-700"}`
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Bold \u2318B");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <BoldIcon
            className="w-3 h-3"
            fill={theme === "light" ? "000#" : "#fff"}
          />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light"
              ? `hover:bg-slate-200 ${
                  editor.isActive("italic") && "bg-slate-200"
                }`
              : `hover:bg-zinc-700 ${
                  editor.isActive("italic") && "bg-zinc-700"
                }`
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Italic \u2318I");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <ItalicIcon
            className="w-3 h-3"
            fill={theme === "light" ? "000#" : "#fff"}
          />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light"
              ? `hover:bg-slate-200 ${
                  editor.isActive("underline") && "bg-slate-200"
                }`
              : `hover:bg-zinc-700 ${
                  editor.isActive("underline") && "bg-zinc-700"
                }`
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Underline \u2318U");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <UnderlineIcon
            className="w-3 h-4"
            fill={theme === "light" ? "#000" : "#fff"}
          />
        </button>

        {/* Strikethrough */}
        {/* <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={classNames(
            "p-1.5 hover:bg-slate-200 h-full",
            editor.isActive("strike") ? "bg-slate-200" : ""
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Strikethrough \u2318\u21E7X");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <StrikeIcon className="w-3 h-3" />
        </button> */}

        {/* Text Colour */}
        {/* <Popover className="relative h-full">
          <Popover.Button
            className="p-1.5 hover:bg-slate-200 h-full"
            onMouseEnter={(event) => {
              handleMouseEnter(event, "Text Colour");
            }}
            onMouseLeave={handleMouseLeave}
          >
            <TextColorIcon
              className="w-4 h-4"
              secondaryFill={editor.getAttributes("textStyle").color}
            />
          </Popover.Button>

          <Popover.Panel className="absolute z-10 bg-white">
            <Compact
              className="bg-white"
              color={editor.getAttributes("textStyle").color}
              onChange={(color) =>
                editor.chain().focus().setColor(color.hex).run()
              }
            />
          </Popover.Panel>
        </Popover> */}

        {/* Highlight Colour */}
        {/* <Popover className="relative h-full">
          <Popover.Button
            className="p-1.5 hover:bg-slate-200 h-full"
            onMouseEnter={(event) => {
              handleMouseEnter(event, "Highlight Colour");
            }}
            onMouseLeave={handleMouseLeave}
          >
            <HighlightColorIcon
              className="w-4 h-4"
              secondaryFill={editor.getAttributes("highlight").color}
            />
          </Popover.Button>
          <Popover.Panel className="absolute z-10 bg-white">
            <Compact
              className="bg-white"
              color={editor.getAttributes("highlight").color}
              onChange={(color) =>
                editor
                  .chain()
                  .focus()
                  .setHighlight({
                    color: color.hex,
                  })
                  .run()
              }
            />
          </Popover.Panel>
        </Popover> */}
      </span>

      {/* <select className="px-2 border" onChange={changeFont}>
        <option value="arial">Arial</option>
        <option value="times">Times</option>
        <option value="courier">Courier</option>
        <option value="verdana">Verdana</option>
        <option value="georgia">Georgia</option>
        <option value="palatino">Palatino</option>
        <option value="garamond">Garamond</option>
        <option value="bookman">Bookman</option>
        <option value="comic sans ms">Comic Sans MS</option>
        <option value="trebuchet ms">Trebuchet MS</option>
        <option value="arial black">Arial Black</option>
        <option value="impact">Impact</option>
      </select>
      <select className="px-2 border" onChange={changeFontSize}>
        <option value="6pt">6</option>
        <option value="7pt">7</option>
        <option value="8pt">8</option>
        <option value="9pt">9</option>
        <option value="10pt">10</option>
        <option value="11pt">11</option>
        <option value="12pt">12</option>
        <option value="14pt">14</option>
        <option value="16pt">16</option>
        <option value="18pt">18</option>
        <option value="24pt">24</option>
        <option value="36pt">36</option>
      </select> */}

      <span className="flex flex-row items-center">
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light"
              ? `hover:bg-slate-200 ${
                  editor.isActive("orderedList") && "bg-slate-200"
                }`
              : `hover:bg-zinc-700 ${
                  editor.isActive("orderedList") && "bg-zinc-700"
                }`
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Numbered List");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <NumberedListIcon
            className="w-4 h-4"
            fill={theme === "light" ? "#000" : "#fff"}
          />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={classNames(
            "p-1.5 h-full",
            theme === "light"
              ? `hover:bg-slate-200 ${
                  editor.isActive("bulletList") && "bg-slate-200"
                }`
              : `hover:bg-zinc-700 ${
                  editor.isActive("bulletList") && "bg-zinc-700"
                }`
          )}
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Bulleted List");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <BulletListIcon
            className="w-4 h-4"
            fill={theme === "light" ? "#000" : "#fff"}
          />
        </button>
      </span>

      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
      <AddLinkModal
        initialTextToDisplay={selectedText}
        isDialogOpen={isAddLinkModalOpen}
        setIsDialogOpen={setIsAddLinkModalOpen}
        addLink={addLink}
      />
    </span>
  );
}
