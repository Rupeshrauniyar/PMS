import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center xl:bg-gradient-to-br from-zinc-50 to-zinc-100 xl:px-4 px:2">
      <div className="w-full xl:max-w-md xl:backdrop-blur-xl xl:border xl:border-zinc-200/60 xl:shadow-xl xl:rounded-2xl xl:p-8 text-center">
        <h1 className="text-6xl font-bold text-zinc-900">404</h1>
        <p className="text-xl text-zinc-700 mt-4">Page Not Found</p>
        <p className="text-sm text-zinc-500 mt-2">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
