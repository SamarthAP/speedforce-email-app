import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "../pages/Signup";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
      </Routes>
    </Router>
  );
}
