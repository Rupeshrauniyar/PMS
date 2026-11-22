import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

import { AppProvider } from "./contexts/AppContext";
import { LiveProvider } from "./contexts/LiveContext";
import { ToastProvider } from "./components/ui/toast";
import { applyThemePreference } from "./lib/theme";
import Index from "./Index";

const App = () => {
  useEffect(() => {
    applyThemePreference();

    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      <AppProvider>
        <ToastProvider withTabbar>
          <Router>
            <LiveProvider>
              <Index />
            </LiveProvider>
          </Router>
        </ToastProvider>
      </AppProvider>
    </div>
  );
};

export default App;
