import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import Index from "./Index";
import Navbar from "./components/Navbar";
import { AppProvider } from "./contexts/AppContext";
// import { Analytics } from "@vercel/analytics/next";
const App = () => {
  useEffect(() => {
    // Apply persisted theme ASAP
    const savedTheme = localStorage.getItem("theme");
    const theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");

    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide();
    }
  }, []);

  return (
    <div className="w-full overflow-x-hidden bg-background text-foreground">
      {/* FCM:{FCM} */}
      {/* <Analytics /> */}
      <AppProvider>
        <Router>
          <Index />
        </Router>
      </AppProvider>
    </div>
  );
};

export default App;
