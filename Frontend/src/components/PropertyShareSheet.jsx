import React, { useEffect, useState } from "react";
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Send,
  ExternalLink,
  Share2,
} from "lucide-react";
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

  const url =
    propertyId != null ? buildPropertyShareUrl(propertyId) : "";
  const title = propertyTitle?.trim() || "Check out this listing";
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  useEffect(() => {
    if (!open) return;
    setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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
    <>
      <div
        data-ptr-ignore
        className="fixed inset-0 z-[1002] bg-black/50 backdrop-blur-sm w-full h-screen flex items-center justify-center "
        aria-hidden
        onClick={onClose}
      />
      <div
        data-ptr-ignore
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        className="fixed left-1/2 top-[42%] z-[1003] w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
              <Share2 className="w-4 h-4 text-zinc-700" />
            </span>
            <div className="min-w-0">
              <h2
                id="share-sheet-title"
                className="text-sm font-semibold text-black truncate"
              >
                Share listing
              </h2>
              <p className="text-[11px] text-zinc-500 line-clamp-2">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 hover:bg-zinc-100 text-zinc-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 mb-2 break-all rounded-lg bg-zinc-50 px-2 py-2 border border-zinc-100">
          {url}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-black hover:bg-zinc-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy link
              </>
            )}
          </button>

          {canNativeShare ? (
            <button
              type="button"
              onClick={shareNative}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share via phone…
            </button>
          ) : (
            <p className="text-[11px] text-center text-zinc-500 px-1">
              Copy the link or use WhatsApp / Telegram — your browser does not expose the system share sheet here.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp
            </a>
            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-sky-50 hover:border-sky-200 transition-colors"
            >
              <Send className="w-4 h-4 text-sky-600" />
              Telegram
            </a>
          </div>

          <button
            type="button"
            onClick={openInNewTab}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview link in new tab
          </button>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-zinc-400 text-center">
          Same link opens in your browser or in the Propatyc app when Android App Links are configured for your domain.
        </p>
      </div>
    </>
  );
}
