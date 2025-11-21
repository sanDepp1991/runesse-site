"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // 🔍 Ask Supabase who is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      console.log("getUser result:", data, error); // debug

      if (!error && data.user) {
        setUserEmail(data.user.email ?? null);
      } else {
        setUserEmail(null);
      }
      setCheckingUser(false);
    };

    checkUser();
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/auth",
      },
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setStatus("Something went wrong. Please try again.");
    } else {
      setStatus("Magic link / OTP sent! Please check your email.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setStatus("Signed out.");
  };

  return (
    <div
      style={{
        padding: "2rem",
        background: "#111",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
        AUTH DEBUG – Sign in to Runesse
      </h1>

      {checkingUser ? (
        <p style={{ marginTop: "1rem" }}>Checking login status…</p>
      ) : userEmail ? (
        <div style={{ marginTop: "1rem" }}>
          <p>
            ✅ You are logged in as: <b>{userEmail}</b>
          </p>
          <button onClick={handleSignOut} style={{ marginTop: "0.5rem" }}>
            Sign out
          </button>
        </div>
      ) : (
        <>
          <p style={{ marginTop: "0.5rem" }}>
            ❌ Not logged in. Enter your email.
          </p>

          <form onSubmit={handleSendMagicLink} style={{ marginTop: "1rem" }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={loading}
              style={{ marginLeft: 8 }}
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          {status && <p style={{ marginTop: "0.5rem" }}>{status}</p>}
        </>
      )}
    </div>
  );
};

export default AuthPage;
