import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import he from "he";
import { useSelectedAccount } from "../contexts/SelectedAccountContext";
import { getThread, listThreads } from "../lib/reactQueryHelperFunctions";
import { gmail_v1 } from "../types/gmail";
import {
  SelectedAccount,
  refreshAccessTokenForEmail,
  refreshAllAccessTokens,
} from "../lib/localstorage";
import UnreadDot from "../components/unreadDot";
import {
  ParsedAttachment,
  extractGmailMessageData,
  parseGmailThreads,
} from "../lib/gmail";
import { DataTable, defaultColumns } from "../components/dataTable";
import { useMemo } from "react";
import { EmailMessage, EmailThread } from "../types/sync";

const getInboxThreads = async (
  selectedAccount: SelectedAccount,
  queryParam: string,
  outlookLabelIds: string[],
  pageToken?: string
) => {
  try {
    const accessToken = await refreshAccessTokenForEmail(selectedAccount.email);
    if (selectedAccount.provider === "google") {
      // TODO: queryParam is not used yet
      const threadRes = await listThreads(accessToken, "", pageToken);

      const promises: Promise<gmail_v1.Schema$Thread>[] = [];
      threadRes.threads.forEach((thread) => {
        promises.push(getThread(accessToken, thread.id));
      });

      const threads = await Promise.all(promises);

      const parsedThreads = parseGmailThreads(threads, selectedAccount.email);

      return {
        threads: parsedThreads,
        nextPageToken: threadRes.nextPageToken,
      };
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};

export const Route = createFileRoute("/_authenticated/dashboard/inbox")({
  component: Inbox,
});

function Inbox() {
  const { selectedAccount } = useSelectedAccount();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["inbox", selectedAccount.email],
    queryFn: ({ pageParam }) =>
      getInboxThreads(selectedAccount, "", [], pageParam),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.nextPageToken,
    staleTime: 1000 * 60 * 1, // 1 min
  });

  // const threads = data?.pages.flatMap((page) => {
  //   if (!page || !page.threads) {
  //     return [];
  //   }
  //   return page.threads;
  // });

  const threads = useMemo(() => {
    return data?.pages.flatMap((page) => {
      if (!page || !page.threads) {
        return [];
      }
      return page.threads;
    });
  }, [data]);

  return (
    <div className="relative flex flex-col gap-y-2 h-full w-full overflow-hidden px-2 pb-2">
      <h2 className="text-3xl font-bold">Inbox</h2>
      {/* <div className="flex flex-col divide-y w-full overflow-y-scroll">
        {(threads || []).map((thread) => (
          <div
            key={thread?.id}
            className="text-sm text-primary hover:bg-accent select-none cursor-pointer gap-x-1 p-2 flex items-center w-full"
          >
            <div className="flex gap-x-1 items-center">
              <div className="bg-zinc-800">
                <UnreadDot />
              </div>
              <div className="bg-zinc-700 max-w-[150px] truncate">
                {thread.from.slice(
                  0,
                  thread.from.lastIndexOf("<") === -1
                    ? thread.from.length
                    : thread.from.lastIndexOf("<")
                )}
              </div>
              <div className="bg-zinc-600 flex truncate">
                {thread.subject || "No subject"}
              </div>
            </div>

            <div className="flex gap-x-1 grow overflow-hidden">
              <div className="bg-zinc-500 flex grow overflow-hidden truncate">
                {he
                  .decode(thread.snippet)
                  .replace(/\u200C/g, "")
                  .trim()}
              </div>
            </div>

            <div className="bg-zinc-400 shrink-0 whitespace-nowrap">
              {isToday(new Date(thread.date))
                ? new Date(thread.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(thread.date).toDateString()}
            </div>
          </div>
        ))}
      </div> */}
      <DataTable columns={defaultColumns} data={threads || []} />
    </div>
  );
}
