import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import AddAccount from "../pages/AddAccount";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import EmailPage from "../pages/_emailPage";

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
              <Route index element={<Home />} />
            </Route>
            <Route path="/page/addAccount" element={<AddAccount />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
