import { useLiveQuery } from "dexie-react-hooks";
import { IAttachment, db } from "../lib/db";
import { AttachmentButton } from "./AttachmentButton";

interface HorizontalAttachmentsProps {
  threadId: string;
}

export function HorizontalAttachments({
  threadId,
}: HorizontalAttachmentsProps) {
  const messages = useLiveQuery(
    () => {
      return db.messages.where("threadId").equals(threadId).sortBy("date");
    },
    [threadId],
    []
  );

  const attachments = messages.reduce((acc, message) => {
    return acc.concat(message.attachments);
  }, [] as IAttachment[]);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="px-10 my-1 col-span-full w-full flex gap-x-1 overflow-x-scroll">
      {attachments.map((attachment, idx) => {
        return <AttachmentButton key={idx} attachment={attachment} />;
      })}
    </div>
  );
}
