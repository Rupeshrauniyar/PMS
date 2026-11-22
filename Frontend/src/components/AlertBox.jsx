import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Compatibility wrapper around native `<dialog>` `Dialog`.
 * New screens should prefer `useToast()` from `@/components/ui/toast`.
 */
const AlertBox = ({ message, type = "info", onClose }) => {
  if (!message) return null;

  const titles = {
    success: "Success",
    error: "Something went wrong",
    warning: "Heads up",
    info: "Notice",
  };

  return (
    <Dialog
      open={Boolean(message)}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
      title={titles[type] || "Notice"}
      description={message}
      footer={
        onClose ? (
          <Button onClick={onClose} data-autofocus="">
            OK
          </Button>
        ) : null
      }
    />
  );
};

export default AlertBox;
