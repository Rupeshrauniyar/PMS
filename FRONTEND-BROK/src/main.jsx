import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { inject } from "@vercel/analytics";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

if (!Capacitor.isNativePlatform()) {
  try {
    inject();
  } catch {
    // Ignore analytics errors in restricted browsers/environments
  }
}
