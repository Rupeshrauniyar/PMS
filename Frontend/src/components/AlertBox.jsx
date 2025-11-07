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
    <>
      <div className="fixed inset-0  w-full h-full z-[3000]  bg-black/80"></div>
      <motion.div
        initial={{ bottom: "-100px", opacity: 0 }}
        animate={{ bottom: "0px", opacity: 1, pathLength: 0.1 }}
        transition={{
          duration: 0.3,
          type: "tween",
          ease: ["easeIn", "easeOut"],
        }}
        className={`fixed z-[3001] bottom-0 left-0 w-full h-30  py-6 px-3 shadow-2xl rounded-t-3xl  bg-white flex flex-col `}
        role="alert"
      >
        <div className="flex items-center">
          {getIcon()}
          <span
            className={`block sm:inline font-semibold  ml-2 text-sm ${getColors()}`}
          >
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
    </>
  );
};

export default AlertBox;
