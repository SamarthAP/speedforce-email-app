import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import AddAccount from "../pages/AddAccount";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/addAccount" element={<AddAccount />} />
      </Routes>
    </Router>
  );
}
