import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CustomCursor from "./components/ui/CustomCursor";
import Navbar from "./components/ui/Navbar";
import LandingPage from "./pages/LandingPage";
import Console from "./pages/Console";
import GmailConnectModal from "./components/ui/GmailConnectModal";
import { getSampleCases } from "./services/api";

function AppContent() {
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [sampleCases, setSampleCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getSampleCases().then(setSampleCases).catch(() => {});
  }, []);

  const handleSelectEmail = (caseId) => {
    setIsGmailOpen(false);
    navigate(`/console?selected=${caseId}`);
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <CustomCursor />
      <Navbar onOpenGmail={() => setIsGmailOpen(true)} />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/console" element={<Console />} />
        </Routes>
      </div>
      <GmailConnectModal
        isOpen={isGmailOpen}
        onClose={() => setIsGmailOpen(false)}
        sampleCases={sampleCases}
        onSelectEmailForInvestigation={handleSelectEmail}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}