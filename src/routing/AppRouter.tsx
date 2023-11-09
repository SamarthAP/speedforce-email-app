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

export default function AppRouter() {
  // returns undefined if the row doesnt exist, also rerenders when u switch tabs and switch back
  // update: this happened because i added a [] as a dependency to useLiveQuery
  const [selectedEmail, loaded] = useLiveQuery(
    () =>
      db.selectedEmail.get(1).then((selectedEmail) => [selectedEmail, true]),
    [],
    []
  );

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
              <Route index element={<WeekCalendarPage />} />
            </Route>
            <Route
              path="/calendar"
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
            {/* <Route path="/calendar" element={<WeekCalendarPage />}></Route> */}
          </>
        )}
      </Routes>
    </Router>
  );
}
