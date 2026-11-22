import React, { useEffect, useState } from "react";
import {
  Copy,
  Check,
  MessageCircle,
  Send,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  buildPropertyShareUrl,
  buildWhatsAppShareUrl,
  buildTelegramShareUrl,
  copyTextToClipboard,
  shareViaNavigatorShare,
} from "../utils/propertyShare";

export default function PropertyShareSheet({
  open,
  onClose,
  propertyId,
  propertyTitle,
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = propertyId != null ? buildPropertyShareUrl(propertyId) : "";
  const title = propertyTitle?.trim() || "Check out this listing on Propatyc";
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open) return;
    setCopied(false);
  }, [open]);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Shareable listing URL copied to clipboard.",
        variant: "success",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Could not copy link",
        variant: "error",
      });
    }
  };

  const openInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareNative = async () => {
    await shareViaNavigatorShare({
      title,
      text: `${title}\n${url}`,
      url,
    });
  };

  const waUrl = buildWhatsAppShareUrl(url, title);
  const tgUrl = buildTelegramShareUrl(url, title);

  return (
    <Sheet
      open={Boolean(open)}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Share listing"
      description={title}
    >
      <div className="flex flex-col gap-3">
        <div className="selectable rounded-2xl border border-border/70 bg-muted/60 px-3.5 py-2.5 text-xs text-muted-foreground break-all">
          {url}
        </div>

        <Button
          variant="outline"
          onClick={handleCopy}
          className="w-full justify-center"
          data-autofocus=""
        >
          {copied ? (
            <>
              <Check className="size-4 text-success" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" />
              <span>Copy link</span>
            </>
          )}
        </Button>

        {canNativeShare ? (
          <Button variant="brand" onClick={shareNative} className="w-full justify-center">
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share via device…</span>
          </Button>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <MessageCircle className="size-4 text-success" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <Send className="size-4 text-info" aria-hidden="true" />
            <span>Telegram</span>
          </a>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={openInNewTab}
          className="w-full justify-center text-muted-foreground"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span>Open link in new tab</span>
        </Button>
      </div>
    </Sheet>
  );
}
