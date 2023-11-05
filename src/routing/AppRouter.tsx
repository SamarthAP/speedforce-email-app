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
import { Session } from "@supabase/supabase-js";
import useWebSocket from "react-use-websocket";
import { SPEEDFORCE_WS_URL } from "../api/constants";
import { dLog } from "../lib/noProd";
import { useCallback } from "react";
import { getAccessToken } from "../api/accessToken";

interface AppRouterProps {
  session: Session;
}

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

    const emails = (await db.emails.toArray()).map((email) => email.email);
    const clientId = await window.electron.ipcRenderer.invoke(
      "store-get",
      "client.id"
    );

    return `${SPEEDFORCE_WS_URL}?emails=${emails.join(",")}&accessToken=${
      session?.access_token
    }&clientId=${clientId}`;
  }, [session]);

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
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

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
            <Route path="/page/addAccount" element={<AddAccount />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
