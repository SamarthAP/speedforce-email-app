import { createFileRoute } from "@tanstack/react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import QuickReply from "../components/dashboard/quickReply";
import PeaModal from "../components/peaModal";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  return (
    <div className="px-2 pb-2 h-full">
      <PeaModal />
      <div className="flex flex-col gap-y-4 h-full">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <Tabs
          defaultValue="replies"
          className="h-full flex flex-col overflow-hidden"
        >
          <TabsList className="inline-block w-fit">
            <TabsTrigger value="replies">Quick Replies</TabsTrigger>
            <TabsTrigger value="actions">Action Items</TabsTrigger>
            <TabsTrigger value="catchup">Catch Up</TabsTrigger>
          </TabsList>
          <TabsContent value="replies" className="grow overflow-scroll">
            <QuickReply />
          </TabsContent>
          <TabsContent value="actions">Action Items</TabsContent>
          <TabsContent value="catchup">Catch up</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
