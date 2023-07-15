import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import AddAccount from "../pages/AddAccount";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

export default function AppRouter() {
  // returns undefined if the row doesnt exist, also rerenders when u switch tabs and switch back
  // update: this happened because i added a [] as a dependency to useLiveQuery
  const selectedEmail = useLiveQuery(() => db.selectedEmail.get(1));

  return (
    <Router>
      <Routes>
        {!selectedEmail ? (
          <Route path="/" element={<AddAccount />} />
        ) : (
          <>
            <Route path="/" element={<Home selectedEmail={selectedEmail} />} />
            <Route path="/addAccount" element={<AddAccount />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
