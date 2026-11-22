import React from "react";
import { Avatar } from "@/components/ui/avatar";

/**
 * Profile avatar wrapper using the shared Avatar primitive.
 */
export function UserAvatarButton({ user, size = "sm", className }) {
  const hasPp =
    typeof user?.pp === "string" &&
    user.pp.trim().length > 5 &&
    (user.pp.startsWith("http") || user.pp.startsWith("/"));

  return (
    <Avatar
      src={hasPp ? user.pp : undefined}
      name={user?.username || "User"}
      size={size}
      className={className}
    />
  );
}
