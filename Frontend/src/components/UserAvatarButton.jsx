import { User2 } from "lucide-react";
import React from "react";

/**
 * Profile entry: photo or initials (no full name).
 */
export function UserAvatarButton({ user, sizeClass = "w-8 h-8", ring = true }) {
  const hasPp =
    typeof user?.pp === "string" &&
    user.pp.trim().length > 5 &&
    (user.pp.startsWith("http") || user.pp.startsWith("/"));

  const letter =
    typeof user?.username === "string" && user.username.trim()
      ? user.username.trim().charAt(0).toUpperCase()
      : "?";

  if (hasPp) {
    return (
      <span
        className={`rounded-full shrink-0 overflow-hidden ${sizeClass} ${
          ring ? "ring-2 ring-background" : ""
        }`}
      >
        <img
          src={user.pp}
          alt=""
          referrerPolicy="no-referrer"
          className={`${sizeClass} object-cover`}
        />
      </span>
    );
  }

  return (
    <span
      className={`rounded-full shrink-0 ${sizeClass} flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground ${
        ring ? "ring-2 ring-background" : ""
      }`}
      aria-hidden
    >
      {letter !== "?" ? letter : <User2 className="w-[55%] h-[55%] opacity-80" />}
    </span>
  );
}
