import React from "react";
import { XCircle, CheckCircle, Info, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
const AlertBox = ({ message, type, onClose }) => {
  const getColors = () => {
    switch (type) {
      case "success":
        return "text-emerald-600 dark:text-emerald-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-foreground";
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
        className="fixed z-[3001] bottom-0 left-0 w-full h-30 py-6 px-3 shadow-2xl rounded-t-3xl bg-background text-foreground flex flex-col border-t border-border"
        role="alert"
      >
        <div className="flex items-center">
          {getIcon()}
          <span
            className={`block sm:inline font-semibold ml-2 text-sm ${getColors()}`}
          >
            {message}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 bg-foreground hover:bg-foreground/90 text-background font-medium p-4 rounded-2xl transition-all"
          >
            OK
          </button>
        )}
      </motion.div>
    </>
  );
};

export default AlertBox;
