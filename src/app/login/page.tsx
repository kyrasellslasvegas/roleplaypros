"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function sendLink() {
    setMsg("Sending…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setMsg("Error: " + error.message);
    else setMsg("Check your email for the login link ✅");
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h1>Login</h1>
      <p style={{ opacity: 0.7 }}>Magic link sign-in</p>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />

      <button onClick={sendLink} style={{ marginTop: 10, padding: 10, width: "100%" }}>
        Send Login Link
      </button>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}


