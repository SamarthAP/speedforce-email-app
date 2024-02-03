import { useState } from "react";
import { db } from "../lib/db";
import { getJWTHeaders } from "../api/authHeader";

export interface ThreadSummaryHoverCardProps {
  threadId: string;
  threadSubject: string;
}

import { turndownService } from "../lib/turndownService";
import { SPEEDFORCE_API_URL } from "../api/constants";
import { useTimeout } from "usehooks-ts";
import { dLog } from "../lib/noProd";

export default function ThreadSummaryHoverCard({
  threadId,
  threadSubject,
}: ThreadSummaryHoverCardProps) {
  const [summary, setSummary] = useState<string>("");

  async function fetchSummary() {
    const cachedSummary = await db.cachedSummaryCardData
      .where("threadId")
      .equals(threadId)
      .first();

    if (cachedSummary) {
      // wait for 700ms since this call will be super fast, compared to calling the api (for better ui/ux)
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSummary(cachedSummary.threadSummary as string);
      return;
    } else {
      const messages = await db.messages
        .where("threadId")
        .equals(threadId)
        .toArray();

      let totalLength = 0;
      const messageList: {
        from: string;
        to: string;
        date: string;
        body: string;
      }[] = [];

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        // if there is not textData, convert the htmlData to markdown text
        const messageText =
          message.textData || turndownService.turndown(message.htmlData);

        totalLength += messageText.length;
        messageList.push({
          from: message.from,
          to: message.toRecipients.join(", "),
          date: new Date(message.date).toString(),
          body: messageText,
        });
      }

      if (totalLength < 95 * 5 || totalLength > 3500 * 5) {
        // do not summarize if the total length is less than 95 words or greater than 3500 words
        await db.cachedSummaryCardData.put({
          threadId,
          threadSummary: "",
        });

        setSummary("");
        return;
      }

      const authHeader = await getJWTHeaders();
      const res = await fetch(`${SPEEDFORCE_API_URL}/llm/summarizeThread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          subject: threadSubject,
          messages: messageList,
        }),
      });

      if (!res.ok) {
        setSummary("");
        dLog("Failed to fetch summary");
      } else {
        const data = await res.json();
        const summary = data.summary;
        // cache the summary
        await db.cachedSummaryCardData.put({
          threadId,
          threadSummary: summary,
        });
        setSummary(summary as string);
        return;
      }
    }
  }

  useTimeout(
    () => {
      void fetchSummary();
    },
    !summary ? 300 : null
  );

  if (!summary) return null;

  return (
    <div
      className={`absolute mt-1.5 fadeIn-animation-300 z-10 flex flex-col space-y-2 p-2 max-w-[256px] rounded-md border border-slate-200 dark:border-zinc-700 text-black dark:text-white bg-slate-100 dark:bg-zinc-800 text-xs`}
    >
      {(summary || "").split("\n").map((sentence, i) => (
        <p key={i}>{sentence}</p>
      ))}
    </div>
  );
}
