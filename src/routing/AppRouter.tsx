import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import AddAccount from "../pages/AddAccount";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<AddAccount />} />
      </Routes>
    </Router>
  );
}
