import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Index from "./Index";
import Navbar from "./components/Navbar";
import { AppProvider } from "./contexts/AppContextx";
// import { Analytics } from "@vercel/analytics/next";

const App = () => {
  return (
    <div className=" w-full  text-black bg-white overflow-x-hidden">
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
