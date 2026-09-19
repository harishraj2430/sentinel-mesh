import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitch() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "light" : "dark";
        setTheme(newTheme);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  if (!mounted) return null;

  return (
    <div className="theme-switch-container" onClick={toggleTheme} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleTheme()} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      <motion.div
        className="theme-switch-track"
        animate={{ background: theme === "dark" ? "rgba(12, 17, 30, 0.9)" : "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="theme-switch-glow"
          animate={{ opacity: theme === "dark" ? 0.6 : 0.6 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="theme-switch-thumb"
          animate={{ 
            transform: theme === "dark" ? "translateX(0) rotateY(0deg)" : "translateX(36px) rotateY(180deg)",
            background: theme === "dark" 
              ? "linear-gradient(135deg, #00f3ff 0%, #2563eb 100%)" 
              : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="theme-switch-icon"
            animate={{ 
              rotate: theme === "dark" ? 0 : 180,
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 0.3 }}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </motion.div>
        </motion.div>
        
        {/* Labels */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "10px",
          transform: "translateY(-50%)",
          fontSize: "8px",
          fontFamily: "'Chakra Petch', sans-serif",
          fontWeight: 700,
          letterSpacing: "1px",
          color: theme === "dark" ? "#00f3ff" : "#2563eb",
          opacity: theme === "dark" ? 1 : 0.4,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          whiteSpace: "nowrap"
        }}>
          DARK
        </div>
        <div style={{
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          fontSize: "8px",
          fontFamily: "'Chakra Petch', sans-serif",
          fontWeight: 700,
          letterSpacing: "1px",
          color: theme === "light" ? "#f59e0b" : "#64748b",
          opacity: theme === "light" ? 1 : 0.4,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          whiteSpace: "nowrap"
        }}>
          LIGHT
        </div>
      </motion.div>
    </div>
  );
}