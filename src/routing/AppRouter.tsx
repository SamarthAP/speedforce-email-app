import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import SentItems from "../pages/SentItems";
import Drafts from "../pages/Drafts";
import Spam from "../pages/Spam";
import DeletedItems from "../pages/DeletedItems";
import Starred from "../pages/Starred";
import Done from "../pages/Done";
import AddAccount from "../pages/AddAccount";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import EmailPage from "../pages/_emailPage";
import WeekCalendarPage from "../pages/WeekCalendarPage";
import WeekCalendar from "../components/Calendars/WeekCalendar";
import { Session } from "@supabase/supabase-js";
import useWebSocket from "react-use-websocket";
import { SPEEDFORCE_WS_URL } from "../api/constants";
import { dLog } from "../lib/noProd";
import { useCallback, useEffect } from "react";
import { getAccessToken } from "../api/accessToken";
import { watch } from "../api/gmail/notifications/pushNotifications";
import { NotificationMessageType } from "../api/model/notifications";
import { partialSync } from "../lib/sync";
import { FOLDER_IDS } from "../api/constants";

interface AppRouterProps {
  session: Session;
}

let isPendingPartialSync = false;
export default function AppRouter({ session }: AppRouterProps) {
  // returns undefined if the row doesnt exist, also rerenders when u switch tabs and switch back
  // update: this happened because i added a [] as a dependency to useLiveQuery
  const [selectedEmail, loaded] = useLiveQuery(
    () =>
      db.selectedEmail.get(1).then((selectedEmail) => [selectedEmail, true]),
    [],
    []
  );

  // TODO: could update dependencies to include the other data that is awaited
  const getSocketUrl = useCallback(async () => {
    const iEmails = await db.emails.toArray();
    const validEmails = [];
    for (const iemail of iEmails) {
      const accessToken = await getAccessToken(iemail.email);
      if (!accessToken) {
        continue;
      } else {
        validEmails.push(iemail.email);
      }
    }

    const emails = await db.emails.toArray();
    const emailAddresses = emails.map((email) => email.email);
    const providers = emails.map((email) => email.provider);
    const clientId = await window.electron.ipcRenderer.invoke(
      "store-get",
      "client.id"
    );


    return `${SPEEDFORCE_WS_URL}?emails=${emailAddresses.join(",")}&providers=${providers.join(",")}&accessToken=${
      session?.access_token
    }&clientId=${clientId}`;
  }, [session]);

  useEffect(() => {
    // send watch command, should prob do for all emails that we want to watch
    if (selectedEmail) {
      void watch(selectedEmail.email);
    }
  }, [session, selectedEmail]);

  useWebSocket(getSocketUrl, {
    onOpen: () => {
      dLog("Websocket connection established");
    },
    onError: (event) => {
      dLog("Websocket error: ", event);
    },
    onClose: () => {
      dLog("Websocket connection closed");
    },
    onMessage: async (event) => {
      dLog("Websocket message received: ", event);
      const data: NotificationMessageType = JSON.parse(event.data);
      
      if(data.messageData.provider === "google"){

        if(isPendingPartialSync) return;
        isPendingPartialSync = true;
        console.log("partial sync running")

        const metadata = await db.googleMetadata.where("email").equals(data.messageData.email).first();
        if(!metadata) return;

        if(parseInt(data.messageData.historyId) > parseInt(metadata.historyId)){
          await partialSync(data.messageData.email, data.messageData.provider, {
            folderId: FOLDER_IDS.INBOX,
          });
        }

        await setTimeout(() => {}, 1000);
        isPendingPartialSync = false;
        console.log("partial sync done")

      } else {
        // TODO: handle outlook notifications
      }
    },
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

    // syncs every 10 mins, but not on render
    useEffect(() => {
      async function handler() {
        dLog("periodic sync");
        if(selectedEmail)
          await partialSync(selectedEmail.email, selectedEmail.provider, {
            folderId: FOLDER_IDS.INBOX,
          });
      }
  
      return window.electron.ipcRenderer.onSyncEmails(handler);
    }, [selectedEmail]);
  
    // syncs on render if last sync was more than 10 mins ago
    useEffect(() => {
      void window.electron.ipcRenderer
        .invoke("store-get", "client.lastWatchTime")
        .then(async (time) => {
          const lastSyncTime = time ? new Date(time) : new Date(0);
          const now = new Date();
          const diff = now.getTime() - lastSyncTime.getTime();
          const days = diff / (1000 * 60 * 60 * 24);
          if (days > 3 && selectedEmail) {
            dLog("on render sync");

            const { data, error } = await watch(selectedEmail.email);
            if(error || !data) {
              dLog(error);
              return;
            }      

            await partialSync(selectedEmail.email, selectedEmail.provider, {
              folderId: FOLDER_IDS.INBOX,
            });
            await window.electron.ipcRenderer.invoke("store-set", {
              key: "client.lastWatchTime",
              value: now,
            });
          }
        });
    }, [selectedEmail]);

  if (!loaded) {
    return <div className="h-screen w-screen"></div>;
  }

  return (
    <Router>
      <Routes>
        {!selectedEmail ? (
          <Route path="/" element={<AddAccount />} />
        ) : (
          <>
            <Route
              path="/"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Home />} />
            </Route>
            <Route
              path="/sent"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<SentItems />} />
            </Route>
            <Route
              path="/drafts"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Drafts />} />
            </Route>
            <Route
              path="/spam"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Spam />} />
            </Route>
            <Route
              path="/deleted"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<DeletedItems />} />
            </Route>
            <Route
              path="/starred"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Starred />} />
            </Route>
            <Route
              path="/done"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Done />} />
            </Route>
            <Route
              path="/calendar"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<WeekCalendarPage />} />
            </Route>
            <Route path="/page/addAccount" element={<AddAccount />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
