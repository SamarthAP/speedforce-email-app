import { classNames } from "../../lib/util";
import { ISelectedEmail } from "../../lib/db";
import TooltipPopover from "../../components/TooltipPopover";
import { useTooltip } from "../../components/UseTooltip";
import { useCallback, useState } from "react";
import { useQuery } from "react-query";
import {
  addCommentToDraft,
  listCommentsForDraft,
} from "../../api/sharedDrafts";
import SimpleButton from "../SimpleButton";
import toast from "react-hot-toast";

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface CommentType {
  id: string;
  email: string;
  comment: string;
  edited?: boolean;
  deleted?: boolean;
  date: number;
}

interface CommentsChainProps {
  threadId: string;
  visible: boolean;
  editMode: boolean;
  selectedEmail: ISelectedEmail;
}

export default function CommentsChain({
  threadId,
  visible,
  editMode,
  selectedEmail,
}: CommentsChainProps) {
  // const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();

  const { data, refetch } = useQuery(
    ["sharedDraftComments", threadId],
    async () => {
      if (!threadId) return;

      const { data, error } = await listCommentsForDraft(threadId);
      if (error) {
        return null;
      }

      return data;
    }
  );

  const handleComment = useCallback(async () => {
    const { error } = await addCommentToDraft(
      threadId,
      selectedEmail.email,
      commentText
    );
    if (error) {
      toast.error("Error adding comment");
    } else {
      toast.success("Comment added");
      void refetch();
    }
    setCommentText("");
  }, [threadId, selectedEmail.email, commentText, refetch]);

  return visible ? (
    <div className="w-80 border-l border-slate-200 dark:border-zinc-700">
      <div className="flex flex-col h-full px-4 pb-4">
        <div className="flex-grow overflow-y-scroll hide-scroll space-y-2">
          {data &&
            data.map((c: CommentType) => (
              <div
                key={c.id}
                className={classNames(
                  "flex flex-col space-y-1",
                  c.email === selectedEmail.email ? "items-end" : "items-start"
                )}
                onMouseEnter={(event) => {
                  handleShowTooltip(event, formatDate(c.date));
                }}
                onMouseLeave={handleHideTooltip}
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-400">
                  {c.email}
                </p>
                <div
                  className={classNames(
                    "w-fit px-2 py-1 rounded-lg",
                    c.email === selectedEmail.email
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  )}
                >
                  <p className="text-sm">{c.comment}</p>
                </div>
              </div>
            ))}
        </div>
        <div className="flex flex-col items-end mt-4 mb-10 space-y-1 w-full max-w-xl">
          <textarea
            className={classNames(
              "form-textarea my-1 p-2 block w-full rounded-md text-xs border-slate-700",
              "shadow-sm focus:border-slate-70 focus:outline-none focus:ring-0 focus:border-gray-900",
              "bg-slate-50 dark:bg-zinc-700 text-black dark:text-zinc-300"
            )}
            rows={1}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <SimpleButton
            text="Comment"
            width="w-20"
            loading={false}
            onClick={() => void handleComment()}
            disabled={commentText.length === 0}
          />
        </div>
      </div>
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  ) : null;
}
