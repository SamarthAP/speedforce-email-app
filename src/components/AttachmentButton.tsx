import { PaperClipIcon } from "@heroicons/react/20/solid";
import { IAttachment, ISelectedEmail } from "../lib/db";
import { classNames } from "../lib/util";
import toast from "react-hot-toast";
import { downloadAttachment } from "../lib/sync";
import { useState } from "react";
import Spinner from "./Spinner";

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

async function openDownloadsFolder(filename: string) {
  const success = await window.electron.ipcRenderer.invoke(
    "open-downloads-folder",
    filename
  );

  return success;
}

interface AttachmentButtonProps {
  attachment: IAttachment;
  messageId: string;
  selectedEmail: ISelectedEmail;
}

export function AttachmentButton({
  attachment,
  messageId,
  selectedEmail,
}: AttachmentButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        setLoading(true);
        void downloadAttachment(
          selectedEmail.email,
          selectedEmail.provider,
          messageId,
          attachment.attachmentId,
          attachment.filename
        ).then(async (res) => {
          if (res.fileName && !res.error) {
            toast.success(
              <div>
                {`${res.fileName} available in downloads folder `}
                <span
                  onClick={() => void openDownloadsFolder(res.fileName)}
                  className="text-blue-500 cursor-pointer underline"
                >
                  here.
                </span>
              </div>,
              { duration: 4000 }
            );
          } else {
            toast.error(`Failed to download ${res.fileName}`);
          }
          setLoading(false);
        });
      }}
      className={classNames(
        "inline-flex items-center h-[32px]",
        "rounded-md px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
        "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600"
      )}
      disabled={loading}
    >
      {!loading ? (
        <PaperClipIcon
          className={classNames(
            "w-4 h-4 mr-1",
            mapMimeTypeToColor(attachment.mimeType)
          )}
        />
      ) : (
        <Spinner className="w-4 h-4 mr-1 !text-slate-600 dark:!text-zinc-300" />
      )}
      <span className="max-w-[128px] truncate">{attachment.filename}</span>
    </button>
  );
}

export function AttachmentButtonSkeleton() {
  return (
    <button
      className={classNames(
        "inline-flex items-center h-[32px]",
        "rounded-md px-2 py-2 text-xs font-semibold shadow-sm focus:outline-none",
        "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600"
      )}
    >
      <PaperClipIcon
        className={classNames(
          "w-4 h-4 mr-1",
          "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
        )}
      />

      <span className="max-w-[128px] truncate">....</span>
    </button>
  );
}
