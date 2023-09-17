import { PaperClipIcon } from "@heroicons/react/20/solid";
import { IAttachment } from "../lib/db";
import { classNames } from "../lib/util";
import toast from "react-hot-toast";
import { runNotProd } from "../lib/noProd";

// TODO: can also add programming languages and stuff, also change to using file extensions
function mapMimeTypeToColor(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return "dark:text-red-600 text-red-500";
    case "application/msword":
      return "dark:text-blue-600 text-blue-500";
    case "image/jpeg":
      return "dark:text-pink-600 text-pink-500";
    case "image/jpg":
      return "dark:text-pink-600 text-pink-500";
    case "image/png":
      return "dark:text-indigo-600 text-indigo-500";
    case "text/csv":
      return "dark:text-green-600 text-green-500";
    default:
      return "text-slate-600 dark:text-zinc-300";
  }
}

interface AttachmentButtonProps {
  attachment: IAttachment;
}

export function AttachmentButton({ attachment }: AttachmentButtonProps) {
  return (
    <button
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        runNotProd(() => toast(JSON.stringify(attachment)));
      }}
      className={classNames(
        "inline-flex items-center",
        "rounded-md px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
        "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
      )}
    >
      <PaperClipIcon
        className={classNames(
          "w-4 h-4 mr-1",
          mapMimeTypeToColor(attachment.mimeType)
        )}
      />
      <span>{attachment.filename}</span>
    </button>
  );
}
