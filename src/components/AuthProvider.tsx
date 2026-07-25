"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/config/firebaseConfig";

type Role = "user" | "lead" | "admin" | "pending";

interface UserProfile {
  name: string;
  email: string;
  role: Role;
  personalDetails?: { ssn?: string; address?: string; phone?: string };
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Remembers which role we already forced a token refresh for, so repeated
  // snapshots can never trigger an endless refresh loop.
  const refreshedForRole = useRef<string | null>(null);

  useEffect(() => {
    // Held here rather than returned from the auth callback: onAuthStateChanged
    // ignores whatever its callback returns, so without this the profile
    // listener would leak on every sign-out / sign-in.
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeDetails: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Tear down any listeners belonging to the previous account.
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (unsubscribeDetails) {
        unsubscribeDetails();
        unsubscribeDetails = null;
      }

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRole(null);
        refreshedForRole.current = null;
        setLoading(false);
        return;
      }

      // Sensitive PII (phone / address / ssn) lives in a separate document so
      // that users/{uid} stays safe for any signed-in user to read. Only the
      // owner and admins can read this one, and only the backend writes it.
      unsubscribeDetails = onSnapshot(
        doc(db, "users", currentUser.uid, "private", "details"),
        (snap) => {
          const details = snap.exists()
            ? (snap.data() as UserProfile["personalDetails"])
            : undefined;
          setProfile((prev) => (prev ? { ...prev, personalDetails: details } : prev));
        },
        () => {
          // Denied or unavailable — the rest of the profile still renders.
        }
      );

      // The user's role lives in their users/{uid} document (mirrored from the
      // backend's custom claim). New signups start as "pending".
      const docRef = doc(db, "users", currentUser.uid);
      unsubscribeProfile = onSnapshot(
        docRef,
        async (snap) => {
          let nextRole: Role = "pending";

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            setRole(data.role);
            nextRole = data.role;
          } else {
            // No profile doc yet — treat as pending, never grant access by default.
            setProfile({
              name: currentUser.displayName || "New User",
              email: currentUser.email || "",
              role: "pending",
            });
            setRole("pending");
          }

          // --- Keep the ID token's custom claim in sync with the users doc ---
          // Firestore rules and every API route authorize from
          // `request.auth.token.role` (the custom claim), NOT this document.
          // After an admin changes a role, the claim inside the cached token
          // stays stale for up to an hour — the user would be routed to their
          // new dashboard but then denied by the rules and the API. Forcing a
          // refresh here pulls the new claim in immediately.
          try {
            const tokenResult = await currentUser.getIdTokenResult();
            const claimRole = (tokenResult.claims.role as string | undefined) ?? null;

            if (claimRole !== nextRole && refreshedForRole.current !== nextRole) {
              refreshedForRole.current = nextRole;
              await currentUser.getIdToken(true);
            }
          } catch {
            // A refresh failure must never block rendering; the user simply
            // keeps the existing token until it renews on its own.
          }

          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeDetails) unsubscribeDetails();
      unsubscribeAuth();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    refreshedForRole.current = null;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
