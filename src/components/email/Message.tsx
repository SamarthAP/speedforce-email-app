import { useState } from "react";
import he from "he";
import { SelectedAccount } from "../../lib/localstorage";
import { EmailMessage } from "../../types/sync";
import ShadowDom from "./ShadowDom";
import { isToday } from "../../lib/date";
import toast from "react-hot-toast";

interface MessageProps {
  message: EmailMessage;
  selectedAccount: SelectedAccount;
  isNotLast?: boolean;
}

export default function Message({
  message,
  selectedAccount,
  isNotLast,
}: MessageProps) {
  const [showBody, setShowBody] = useState(() => !isNotLast);
  return (
    <div className="w-full flex flex-col overflow-hidden">
      <div
        className="flex items-start p-4 cursor-pointer"
        onClick={() => {
          setShowBody(!showBody);
        }}
      >
        <div className="grid gap-1">
          <div className="text-sm font-semibold line-clamp-1">
            <span
              onClick={(event) => {
                event.stopPropagation();

                // save to clipboard

                void navigator.clipboard
                  .writeText(
                    message.from.match(
                      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
                    )?.[0] || message.from
                  )
                  .then(() => {
                    toast("Copied email to clipboard");
                  });
              }}
            >
              {message.from}
            </span>
          </div>
          <div
            className="text-xs line-clamp-1"
            onClick={(event) => event.stopPropagation()}
          >
            {message.subject.trim() || "(no subject)"}
          </div>
        </div>
        <div
          className="ml-auto text-xs text-muted-foreground shrink-0"
          onClick={(event) => event.stopPropagation()}
        >
          {isToday(new Date(message.date))
            ? new Date(message.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : new Date(message.date).toDateString()}
        </div>
      </div>
      {showBody ? (
        <div className="p-4 text-sm overflow-x-scroll">
          <ShadowDom htmlString={message.htmlData} />
        </div>
      ) : (
        <div className="p-4 text-sm text-muted-foreground">
          <span className="line-clamp-1">
            {he
              .decode(message.snippet)
              .replace(/\u200C/g, "")
              .trim()}
          </span>
        </div>
      )}
    </div>
  );
}
