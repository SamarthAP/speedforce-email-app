import { useLiveQuery } from "dexie-react-hooks";
import {
  IAttachment,
  IEmailThread,
  IMessage,
  ISelectedEmail,
  db,
} from "../lib/db";
import { AttachmentButton, AttachmentButtonSkeleton } from "./AttachmentButton";

interface HorizontalAttachmentsProps {
  thread: IEmailThread;
  selectedEmail: ISelectedEmail;
}

export function HorizontalAttachments({
  thread,
  selectedEmail,
}: HorizontalAttachmentsProps) {
  const messages = useLiveQuery(
    () => {
      return db.messages.where("threadId").equals(thread.id).sortBy("date");
    },
    [thread.id],
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

  if (!thread.hasAttachments) {
    return null;
  }

  if (thread.hasAttachments && messages.length === 0) {
    return (
      <div className="px-10 my-1 col-span-full w-full flex gap-x-1 overflow-x-scroll hide-scroll">
        <AttachmentButtonSkeleton />
      </div>
    );
  }

  return (
    <div className="px-10 my-1 col-span-full w-full flex gap-x-1 overflow-x-scroll hide-scroll">
      {attachments.map((attachment: IAttachment, idx: number) => {
        return (
          <AttachmentButton
            key={idx}
            attachment={attachment}
            messageId={messageId}
            selectedEmail={selectedEmail}
          />
        );
      })}
    </div>
  );
}
