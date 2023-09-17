import ThreadView from "../components/ThreadView";
import { ID_INBOX } from "../api/constants";
import { useEffect } from "react";
import { useEmailPageOutletContext } from "./_emailPage";
import { partialSync } from "../lib/sync";
import { dLog } from "../lib/noProd";

export default function Home() {
  const { selectedEmail } = useEmailPageOutletContext();

  // syncs every 10 mins, but not on render
  useEffect(() => {
    async function handler() {
      dLog("periodic sync");
      await partialSync(selectedEmail.email, selectedEmail.provider, {
        folderId: ID_INBOX,
      });
    }

    return window.electron.ipcRenderer.onSyncEmails(handler);
  }, [selectedEmail]);

  // syncs on render if last sync was more than 10 mins ago
  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("store-get", "client.lastSyncTime")
      .then(async (time) => {
        const lastSyncTime = time ? new Date(time) : new Date(0);
        const now = new Date();
        const diff = now.getTime() - lastSyncTime.getTime();
        const mins = diff / (1000 * 60 * 10);
        if (mins > 10) {
          dLog("on render sync");
          await partialSync(selectedEmail.email, selectedEmail.provider, {
            folderId: ID_INBOX,
          });
          await window.electron.ipcRenderer.invoke("store-set", {
            key: "client.lastSyncTime",
            value: now,
          });
        }
      });
  }, [selectedEmail]);

  return <ThreadView folderId={ID_INBOX} title="Important" />;
}
