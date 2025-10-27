import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Index from "./Index";
import Navbar from "./components/Navbar";
import { AppProvider } from "./contexts/AppContextx";
// import { Analytics } from "@vercel/analytics/next";

const App = () => {
  return (
    <div className=" w-full min-h-screen text-black bg-white overflow-x-hidden">
      {/* FCM:{FCM} */}
      {/* <Analytics /> */}
      <AppProvider>
        <Router>
          <Navbar />
          <div className="p-2 z-5 w-full h-full">
            <Index />
          </div>
        </Router>
      </AppProvider>
    </div>
  );
};

export default App;
