"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // The user's role lives in their users/{uid} document (mirrored from the
      // backend's custom claim). New signups start as "pending".
      const docRef = doc(db, "users", currentUser.uid);
      const unsubscribeProfile = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            setRole(data.role);
          } else {
            // No profile doc yet — treat as pending, never grant access by default.
            setProfile({
              name: currentUser.displayName || "New User",
              email: currentUser.email || "",
              role: "pending",
            });
            setRole("pending");
          }
          setLoading(false);
        },
        () => setLoading(false)
      );

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
