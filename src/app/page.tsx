"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebaseConfig";
import { useAuth } from "@/components/AuthProvider";
import { FileText, Lock, Mail, User, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Once signed in, route by role: pending -> waiting list, otherwise dashboard.
  useEffect(() => {
    if (!loading && user && role) {
      if (role === "pending") {
        router.push("/pending");
      } else {
        router.push(`/dashboard/${role}`);
      }
    }
  }, [user, role, loading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // New signups land on the approval waiting list (role "pending"); an
        // admin assigns the real role via the backend. This matches the
        // Firestore rule that only allows creating your own doc as "pending".
        // Only non-sensitive profile fields go here — users/{uid} is readable
        // by any signed-in user. PII (phone/address/ssn) is written separately
        // to users/{uid}/private/details by PATCH /api/users/[id].
        await setDoc(doc(db, "users", cred.user.uid), {
          name: fullName || "New User",
          email: cred.user.email,
          role: "pending",
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Check your details.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-50 px-4">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/60 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-slate-900 leading-none tracking-tight">QNNX</h1>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Workspace</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">Secure Internal Workspace Management Gateway</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            {isSignUp ? "Create Workspace Profile" : "Access Workspace"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">
                {error}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {authLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  {isSignUp ? "Register Account" : "Access Workspace"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need workspace credentials? Register"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
