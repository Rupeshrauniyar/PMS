import React from "react";
import { Navigate } from "react-router-dom";

/** Legacy demo reels route redirects cleanly to Home (Video Tours). */
const Reels = () => {
  return <Navigate to="/" replace />;
};

export default Reels;
