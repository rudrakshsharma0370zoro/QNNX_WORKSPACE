"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Clock, LogOut, ShieldCheck } from "lucide-react";

export default function PendingPage() {
  const { user, role, profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    // As soon as an admin assigns a real role, move into the dashboard.
    if (role && role !== "pending") {
      router.push(`/dashboard/${role}`);
    }
  }, [user, role, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-50 px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/60 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
          <Clock className="w-9 h-9 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re on the waiting list</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Welcome{profile?.name ? `, ${profile.name}` : ""}. Your account has been
          created and is awaiting approval. An administrator will review your
          request and assign your role shortly.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-3 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            Account created &amp; secured
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            Awaiting an admin to assign your role
          </div>
          <p className="text-xs text-slate-400 pt-1">
            This page updates automatically once you&apos;re approved — no need to refresh.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-900 text-sm transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
