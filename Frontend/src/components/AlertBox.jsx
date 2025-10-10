import React from "react";
import { XCircle, CheckCircle, Info, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
const AlertBox = ({ message, type, onClose }) => {
  const getColors = () => {
    switch (type) {
      case "success":
        return " text-green-700";
      case "error":
        return " text-red-700";
      case "warning":
        return " text-yellow-700";
      case "info":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <XCircle size={20} />;
      case "warning":
        return <TriangleAlert size={20} />;
      case "info":
        return <Info size={20} />;
      default:
        return null;
    }
  };

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div
        initial={{ top: "1000px", opacity: 0 }}
        animate={{ top:"410px", opacity: 1 }}
        className={`relative w-full h-100 py-6 px-3 shadow-2xl rounded-t-3xl  bg-white flex flex-col `}
        role="alert"
      >
        <div className="flex items-center">
          {getIcon()}
          <span className={`block sm:inline font-semibold  ml-2 text-sm ${getColors()}`}>
            {message}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium p-4 rounded-2xl  transition-all"
          >
            OK
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default AlertBox;
