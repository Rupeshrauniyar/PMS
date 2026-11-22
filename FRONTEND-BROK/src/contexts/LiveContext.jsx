import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as brokerApi from "@/api/broker";
import { useApp } from "./AppContext";
import { useVisiblePolling } from "@/hooks/usePageVisible";
import { getErrorMessage } from "@/lib/errors";

/**
 * App-wide live data for the shell: notifications (+ unread badge) and the
 * open-pool count badge. Polls every minute while the page is visible.
 */
const LiveContext = createContext(null);

const POLL_MS = 60_000;

export function LiveProvider({ children }) {
  const { user } = useApp();
  const signedIn = Boolean(user?._id);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(null);
  const [poolCount, setPoolCount] = useState(null);
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await brokerApi.getNotifications();
      setNotifications(res.notifications ?? []);
      setUnreadCount(res.unreadCount ?? 0);
      setNotifError(null);
    } catch (err) {
      setNotifError(getErrorMessage(err));
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const refreshPoolCount = useCallback(async () => {
    try {
      const res = await brokerApi.getPool({ page: 1, limit: 1 });
      setPoolCount(res.total ?? 0);
    } catch {
      /* badge is best-effort */
    }
  }, []);

  const refreshAll = useCallback(
    () => Promise.all([refreshNotifications(), refreshPoolCount()]),
    [refreshNotifications, refreshPoolCount],
  );

  useEffect(() => {
    if (!signedIn) {
      setNotifications([]);
      setUnreadCount(0);
      setPoolCount(null);
      setNotifLoading(true);
      return;
    }
    refreshAll();
  }, [signedIn, refreshAll]);

  useVisiblePolling(refreshAll, POLL_MS, { enabled: signedIn });

  const markRead = useCallback(async (id) => {
    const target = notificationsRef.current.find((n) => n._id === id);
    if (!target || target.read) return;
    setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await brokerApi.markNotificationRead(id);
    } catch {
      /* resync on next poll */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await brokerApi.markAllNotificationsRead();
    } catch (err) {
      refreshNotifications();
      throw err;
    }
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      notifLoading,
      notifError,
      refreshNotifications,
      markRead,
      markAllRead,
      poolCount,
      setPoolCount,
      refreshPoolCount,
      refreshAll,
    }),
    [
      notifications,
      unreadCount,
      notifLoading,
      notifError,
      refreshNotifications,
      markRead,
      markAllRead,
      poolCount,
      refreshPoolCount,
      refreshAll,
    ],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLive = () => useContext(LiveContext);
