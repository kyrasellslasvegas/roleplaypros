"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Loading…");

  // Create the client once (not on every render)
  const supabase = useMemo(() => supabaseBrowser(), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        setStatus(`Auth error: ${error.message}`);
        return;
      }

      const userEmail = data.user?.email ?? null;
      setEmail(userEmail);
      setStatus(userEmail ? "Ready ✅" : "Not logged in");
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function logout() {
    setStatus("Signing out…");
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto", padding: 24, fontFamily: "system-ui" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
            Status: <b>{status}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/session/test123"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#111",
            }}
          >
            Start Session
          </Link>

          <button
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Signed-in user</h2>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Email: <b>{email ?? "—"}</b>
        </div>

        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.75 }}>
          Next: we’ll show your saved roleplay sessions + coaching results here.
        </div>
      </div>
    </div>
  );
}
