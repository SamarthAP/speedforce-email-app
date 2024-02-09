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
import { Session } from "@supabase/supabase-js";
import useWebSocket from "react-use-websocket";
import { SPEEDFORCE_WS_URL } from "../api/constants";
import { dLog } from "../lib/noProd";
import { useCallback, useEffect } from "react";
import { getAccessToken } from "../api/accessToken";
import { loadContacts, watchSubscription } from "../lib/sync";
import { handleMessage } from "../lib/wsHelpers";
import Search from "../pages/Search";
import InboxZeroSetup from "../pages/InboxZeroSetup";
import Settings from "../pages/Settings";
import { ComposeMessage } from "../pages/ComposeMessage";
import ThreadPage from "../pages/ThreadPage";
import Other from "../pages/Other";
import { EditDraft } from "../pages/EditDraft";

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

    return `${SPEEDFORCE_WS_URL}?emails=${emailAddresses.join(
      ","
    )}&providers=${providers.join(",")}&accessToken=${
      session?.access_token
    }&clientId=${clientId}`;
  }, [session]);

  useEffect(() => {
    // send watch command, should prob do for all emails that we want to watch
    if (selectedEmail) {
      void watchSubscription(selectedEmail.email, selectedEmail.provider);
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
    onMessage: (event) => {
      dLog("new ws message");
      async function handle() {
        if (isPendingPartialSync) return;
        isPendingPartialSync = true;
        await handleMessage(event);
        isPendingPartialSync = false;
      }
      void handle();
    },
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  // // syncs every 10 mins, but not on render
  // useEffect(() => {
  //   async function handler() {
  //     dLog("periodic sync");
  //     if (selectedEmail)
  //       await partialSync(selectedEmail.email, selectedEmail.provider, {
  //         folderId: FOLDER_IDS.INBOX,
  //       });
  //   }

  //   return window.electron.ipcRenderer.onSyncEmails(handler);
  // }, [selectedEmail]);

  // watchs subscriptions and syncs on render if last sync was more than 3 days ago
  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("store-get", "client.lastWatchTime")
      .then(async (time: string) => {
        const lastSyncTime = time ? new Date(parseInt(time)) : new Date(0);
        const now = new Date();
        const diff = now.getTime() - lastSyncTime.getTime();
        const days = diff / (1000 * 60 * 60 * 24);

        if (days > 3 && selectedEmail) {
          dLog("on render sync");

          const { data, error } = await watchSubscription(
            selectedEmail.email,
            selectedEmail.provider
          );
          if (error || !data) {
            dLog(error);
            return;
          }

          // await partialSync(selectedEmail.email, selectedEmail.provider, {
          //   folderId: FOLDER_IDS.INBOX,
          // });

          await window.electron.ipcRenderer.invoke(
            "store-set",
            "client.lastWatchTime",
            now.getTime().toString()
          );
        }
      });
  }, [selectedEmail]);

  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("store-get", "client.lastSyncContactsTime")
      .then(async (time: string) => {
        const lastSyncTime = time ? new Date(parseInt(time)) : new Date(0);
        const now = new Date();
        const diff = now.getTime() - lastSyncTime.getTime();
        const n_half_hours = diff / (1000 * 60 * 30); // divide by 30 mins

        if (n_half_hours > 1) {
          const emails = await db.emails.toArray();

          for (const email of emails) {
            dLog("loading contacts for ", email.email);
            await loadContacts(email.email, email.provider);
          }

          await window.electron.ipcRenderer.invoke(
            "store-set",
            "client.lastSyncContactsTime",
            now.getTime().toString()
          );
        }
      });
  }, []);

  useEffect(() => {
    async function getInboxZeroImage() {
      // get current date in YYYY-MM-DD format but don't use ISO string because it's in UTC
      const currentDate = new Date();

      // Extract year, month, and date
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because month index starts from 0
      const day = String(currentDate.getDate()).padStart(2, "0");

      const date = `${year}-${month}-${day}`;

      // const dailyImageMetadata = await db.dailyImageMetadata.get(1);

      // if (dailyImageMetadata && dailyImageMetadata.date === date) {
      //   dLog("daily image data already exists");
      //   return {
      //     dailyImageMetadata: {
      //       date: dailyImageMetadata.date,
      //       url: dailyImageMetadata.url,
      //     },
      //     dataAlreadyExists: true,
      //   };
      // }

      dLog("fetching daily image data");

      const accessToken = session.access_token;

      const encodedImage = await window.electron.ipcRenderer.invoke(
        "download-daily-image",
        accessToken,
        date
      );

      if (!encodedImage) {
        dLog("Couln't get encoded image");
        return {
          dailyImageMetadata: {
            date: "",
            url: "",
          },
          dataAlreadyExists: false,
        };
      } else {
        return {
          dailyImageMetadata: {
            date,
            url: encodedImage,
          },
          dataAlreadyExists: false,
        };
      }
    }

    getInboxZeroImage()
      .then(({ dailyImageMetadata, dataAlreadyExists }) => {
        if (dataAlreadyExists) return;

        void db.dailyImageMetadata.put({
          id: 1,
          ...dailyImageMetadata,
        });
      })
      .catch((err) => {
        dLog(err);
      });
  }, [selectedEmail, session]);

  if (!loaded) {
    return <div className="h-screen w-screen dark:bg-zinc-900"></div>;
  }

  // add initialEntries={["/page/inboxZeroSetup"]} to Router to force a specific route
  return (
    <Router>
      <Routes>
        {!selectedEmail ? (
          <Route path="/" element={<AddAccount />} />
        ) : selectedEmail && !selectedEmail.inboxZeroStartDate ? (
          <>
            <Route
              path="/"
              element={<InboxZeroSetup selectedEmail={selectedEmail} />}
            />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route
                index
                element={
                  <Home inboxZeroStartDate={selectedEmail.inboxZeroStartDate} />
                }
              />
            </Route>
            <Route
              path="/other"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route
                index
                element={
                  <Other
                    inboxZeroStartDate={selectedEmail.inboxZeroStartDate}
                  />
                }
              />
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
              path="/search"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<Search />} />
            </Route>
            <Route
              path="/calendar"
              element={<EmailPage selectedEmail={selectedEmail} />}
            >
              <Route index element={<WeekCalendarPage />} />
            </Route>
            <Route
              path="/settings"
              element={<Settings selectedEmail={selectedEmail} />}
            ></Route>
            <Route path="/page/addAccount" element={<AddAccount />} />
            <Route
              path="/page/inboxZeroSetup"
              element={<InboxZeroSetup selectedEmail={selectedEmail} />}
            />
            <Route
              path="/compose"
              element={<ComposeMessage selectedEmail={selectedEmail} />}
            ></Route>
            <Route
              path="/draft/:threadId"
              element={<EditDraft selectedEmail={selectedEmail} />}
            ></Route>
            <Route
              path="/thread/:threadId"
              element={<ThreadPage selectedEmail={selectedEmail} />}
            ></Route>
          </>
        )}
      </Routes>
    </Router>
  );
}
