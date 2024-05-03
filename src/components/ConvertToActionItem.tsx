import { ArrowsPointingInIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { IEmailThread, db } from "../lib/db";
import toast from "react-hot-toast";
import { handleArchiveClick } from "../lib/asyncHelpers";

interface ConvertToActionItemProps {
  thread: IEmailThread;
  email: string;
  provider: "google" | "outlook";
  handleShowTooltip: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    message: string
  ) => void;
  handleHideTooltip: () => void;
}

export default function ConvertToActionItem({
  thread,
  email,
  provider,
  handleShowTooltip,
  handleHideTooltip,
}: ConvertToActionItemProps) {
  const [loading, setLoading] = useState(false);

  async function convertToActionItem() {
    setLoading(true);

    try {
      if (thread.actionItemString) {
        await db.actionItems.put({
          threadId: thread.id,
          email,
          actionItemString: thread.actionItemString,
          completed: false,
        });
        await handleArchiveClick(thread, email, provider);
      }
    } catch (error) {
      toast("Failed to convert to action item");
    }
  }

  return (
    <button
      disabled={loading}
      onMouseEnter={(event) => {
        handleShowTooltip(event, "Convert to Action Item");
      }}
      onMouseLeave={handleHideTooltip}
      onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        void convertToActionItem();
      }}
    >
      <ArrowsPointingInIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 " />
    </button>
  );
}
