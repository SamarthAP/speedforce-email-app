import { useCallback, useState } from "react";
import { SharedDraftCommentType } from "../../api/model/users.shared.draft";
import SimpleButton from "../SimpleButton";
import { addCommentToDraft } from "../../api/sharedDrafts";
import { ISelectedEmail } from "../../lib/db";
import toast from "react-hot-toast";

interface CommentProps {
  email: string;
  comment: string;
  timestamp: number; // Unix timestamp
}

function Comment({ email, comment, timestamp }: CommentProps) {
  // Convert Unix timestamp to a readable date format
  const date = new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 my-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className="font-semibold">{email}</div>
        <div className="text-gray-500 italic text-sm">{date}</div>
      </div>
      <div className="text-gray-800 text-sm">{comment}</div>
    </div>
  );
}

interface CommentSectionProps {
  selectedEmail: ISelectedEmail;
  draftId: string;
  comments: any[];
  editMode?: boolean;
}

export default function CommentSection({
  selectedEmail,
  draftId,
  comments,
  editMode = false,
}: CommentSectionProps) {
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleComment = useCallback(async () => {
    const { error } = await addCommentToDraft(
      draftId,
      selectedEmail.email,
      commentText
    );
    if (error) {
      toast.error("Error adding comment");
    } else {
      toast.success("Comment added");
    }
    setCommentText("");
  }, [draftId, selectedEmail.email, commentText]);

  return (
    <div className="border-slate-200 dark:border-zinc-700 border-t p-4">
      <div className="text-slate-800 dark:text-zinc-200">
        {comments.length} comments
      </div>
      {editMode && (
        <div className="flex flex-col mt-4 space-y-2 w-full max-w-xl">
          <textarea
            className="form-textarea mt-1 p-2 block w-full rounded-md border-slate-700 shadow-sm focus:border-slate-700"
            rows={1}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onFocus={() => setIsCommentFocused(true)}
          />
          {isCommentFocused && (
            <div className="w-full flex flex-row items-center justify-end space-x-2">
              <SimpleButton
                text="Cancel"
                loading={false}
                onClick={() => setIsCommentFocused(false)}
                seeThrough
              />
              <SimpleButton
                text="Comment"
                loading={false}
                onClick={() => void handleComment()}
                disabled={commentText.length === 0}
              />
            </div>
          )}
        </div>
      )}
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          email={comment.commentor?.email || ""}
          timestamp={comment.date}
          comment={comment.comment}
        />
      ))}
    </div>
  );
}
