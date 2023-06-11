import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import AuthChecker from "../pages/AuthChecker";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthChecker />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}
