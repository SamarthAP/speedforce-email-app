import { SelectedAccount } from "../../lib/localstorage";
import { EmailThread } from "../../types/sync";
import Message from "./Message";

export interface ThreadProps {
  thread: EmailThread;
  selectedAccount: SelectedAccount;
}

export default function Thread({ thread, selectedAccount }: ThreadProps) {
  return (
    <div className="grid divide-y-8 overflow-hidden">
      {thread.messages.map((message, index) => {
        return (
          <Message
            key={message.id}
            message={message}
            selectedAccount={selectedAccount}
            isNotLast={index !== thread.messages.length - 1}
          />
        );
      })}
    </div>
  );
}
