"use client";

/**
 * Shared session-level Firestore listeners.
 *
 * Before this file existed, 14 separate dashboard pages each opened their
 * own `onSnapshot(collection(db, 'users'))` listener, and 3 pages each did
 * the same for `activityLog` — meaning every single navigation between
 * pages tore down one full-collection listener and opened a brand new one,
 * paying for a fresh full read of data that almost certainly hadn't
 * changed since the previous page.
 *
 * This provider opens each of those listeners exactly ONCE, at the root of
 * the app, for the lifetime of the session (only while a user is signed
 * in), and hands the results down via context. Pages that need the roster
 * or the activity feed call `useUsers()` / `useActivityLog()` instead of
 * subscribing themselves — one shared read instead of N duplicated ones.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useAuth } from "@/components/AuthProvider";

export interface AppUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  team?: string;
  [key: string]: unknown;
}

export interface ActivityLogEntry {
  id: string;
  [key: string]: unknown;
}

interface AppDataContextType {
  users: AppUser[];
  usersLoading: boolean;
  // Top 20 activity-log entries, newest first. Consumers that only need the
  // 10 most recent just slice the first 10 — no extra read, same order.
  activityLog: ActivityLogEntry[];
  activityLogLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType>({
  users: [],
  usersLoading: true,
  activityLog: [],
  activityLogLoading: true,
});

/** Full employee roster, fetched once and shared across every page. */
export const useUsers = () => useContext(AppDataContext).users;

/** Whether the shared roster's first load is still in flight. */
export const useUsersLoading = () => useContext(AppDataContext).usersLoading;

/** Recent activity-log entries (newest first), fetched once and shared. */
export const useActivityLog = () => useContext(AppDataContext).activityLog;

export const useActivityLogLoading = () => useContext(AppDataContext).activityLogLoading;

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityLogLoading, setActivityLogLoading] = useState(true);

  useEffect(() => {
    // No signed-in user yet (or signed out) — nothing to fetch, and
    // firestore.rules would deny an unauthenticated read anyway.
    if (!user) {
      setUsers([]);
      setActivityLog([]);
      setUsersLoading(true);
      setActivityLogLoading(true);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AppUser[]);
        setUsersLoading(false);
      },
      () => setUsersLoading(false)
    );

    const unsubActivityLog = onSnapshot(
      query(collection(db, "activityLog"), orderBy("createdAt", "desc"), limit(20)),
      (snapshot) => {
        setActivityLog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ActivityLogEntry[]);
        setActivityLogLoading(false);
      },
      () => setActivityLogLoading(false)
    );

    return () => {
      unsubUsers();
      unsubActivityLog();
    };
  }, [user]);

  return (
    <AppDataContext.Provider value={{ users, usersLoading, activityLog, activityLogLoading }}>
      {children}
    </AppDataContext.Provider>
  );
};
