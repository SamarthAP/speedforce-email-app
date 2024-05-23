import { useQuery } from "@tanstack/react-query";
import { useSelectedAccount } from "../../contexts/SelectedAccountContext";
import { ResponseData, listQuickReplies } from "../../api/dashboard";
import { refreshAccessTokenForEmail } from "../../lib/localstorage";
import { gmail_v1 } from "../../types/gmail";
import { getThread } from "../../lib/reactQueryHelperFunctions";
import { parseGmailThreads } from "../../lib/gmail";
import { EmailThread } from "../../types/sync";
import Thread from "../email/Thread";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export default function QuickReply() {
  const { selectedAccount } = useSelectedAccount();

  const { data } = useQuery({
    queryKey: ["quickReply", selectedAccount.email],
    queryFn: async () => {
      const { data, error } = await listQuickReplies(selectedAccount.email);

      if (error || !data) {
        throw new Error(error);
      }

      const accessToken = await refreshAccessTokenForEmail(
        selectedAccount.email
      );

      const parsedResponses: {
        threadId: string;
        response: string;
        parsedThread: EmailThread;
      }[] = [];

      if (selectedAccount.provider === "google") {
        const promises: Promise<gmail_v1.Schema$Thread>[] = [];
        data.responses.forEach((responseItem) => {
          promises.push(getThread(accessToken, responseItem.thread_id));
        });

        const mapOfThreadResponses = new Map<string, ResponseData>();

        data.responses.forEach((responseItem) => {
          mapOfThreadResponses.set(responseItem.thread_id, responseItem);
        });

        const threads = await Promise.all(promises);

        const parsedThreads = parseGmailThreads(threads, selectedAccount.email);

        parsedThreads.forEach((parsedThread) => {
          parsedResponses.push({
            threadId: parsedThread.id,
            response: mapOfThreadResponses.get(parsedThread.id)?.response || "",
            parsedThread,
          });
        });
      }

      // return data
      return parsedResponses;
    },
    staleTime: 1000 * 60 * 1, // 1 min
  });

  return (
    <div className="grid gap-y-8">
      {data?.map((response) => {
        return (
          <Card key={response.threadId}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={66}>
                <div className="pr-2">
                  <Thread
                    thread={response.parsedThread}
                    selectedAccount={selectedAccount}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="mx-2 my-4 hover:bg-primary transition-all duration-300"
              />
              <ResizablePanel defaultSize={34}>
                <div className="p-4 pl-2">
                  <Textarea
                    className="h-[300px]"
                    defaultValue={response.response}
                  />
                  <div className="text-right mt-2">
                    <Button size="sm" className="">
                      Send
                    </Button>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>
        );
      })}
    </div>
  );
}
