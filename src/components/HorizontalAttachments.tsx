import { useLiveQuery } from "dexie-react-hooks";
import { IAttachment, IMessage, db } from "../lib/db";
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
  ) as IMessage[];

  let attachments: IAttachment[] = [];
  let messageId = "";
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].attachments.length > 0) {
      attachments = messages[i].attachments;
      messageId = messages[i].id;
      break;
    }
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="px-10 my-1 col-span-full w-full flex gap-x-1 overflow-x-scroll">
      {attachments.map((attachment: IAttachment, idx: number) => {
        return (
          <AttachmentButton
            key={idx}
            attachment={attachment}
            messageId={messageId}
          />
        );
      })}
    </div>
  );
}
