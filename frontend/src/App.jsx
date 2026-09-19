import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomCursor from "./components/ui/CustomCursor";
import Navbar from "./components/ui/Navbar";
import LandingPage from "./pages/LandingPage";
import Console from "./pages/Console";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <CustomCursor />
        <Navbar />
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/console" element={<Console />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}