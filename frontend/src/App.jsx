import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomCursor from "./components/ui/CustomCursor";
import Navbar from "./components/ui/Navbar";
import LandingPage from "./pages/LandingPage";
import Console from "./pages/Console";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: "#050505", minHeight: "100vh" }}>
        <CustomCursor />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/console" element={<Console />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}