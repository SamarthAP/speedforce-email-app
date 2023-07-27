import { useState } from "react";
import dayjs from "dayjs";
import { cleanHtmlString } from "../lib/util";
import { IGoogleMessage } from "../lib/db";
import ShadowDom from "./ShadowDom";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

interface MessageProps {
  message: IGoogleMessage;
  key: string;
}

export default function Message({ message }: MessageProps) {
  const [showBody, setShowBody] = useState(true);
  return (
    <div className="w-full h-auto flex flex-col border border-slate-200 dark:border-zinc-700">
      <div
        onClick={() => setShowBody((old) => !old)}
        className="flex justify-between p-4 cursor-pointer"
      >
        <p className="dark:text-zinc-400 text-slate-500 text-sm">
          {message.from}
        </p>
        <div className="flex items-center">
          <ArrowUturnLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500 mr-2" />
          <p className="dark:text-zinc-400 text-slate-500 text-sm">
            {dayjs(message.date).format("MMM D, YYYY h:mm A")}
          </p>
        </div>
      </div>
      {showBody && (
        <div className="pb-4 px-4">
          <ShadowDom htmlString={cleanHtmlString(message.htmlData)} />
        </div>
      )}
    </div>
  );
}
