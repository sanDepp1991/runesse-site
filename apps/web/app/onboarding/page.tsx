"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Role = "BUYER" | "CARDHOLDER" | "BOTH";

const OnboardingPage: React.FC = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<Role>("BUYER");

  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Make sure user is logged in; otherwise send to /auth
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user && data.user.email) {
  setUser({ email: data.user.email });
} else {
  router.push("/auth");
}

      setLoadingUser(false);
    };

    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setErrorMsg(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
  fullName,
  phoneNumber,
  role,
  email: user.email,
}),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.message || "Something went wrong. Please try again.");
      return;
    }

    if (role === "BUYER") router.push("/buyer");
    else if (role === "CARDHOLDER") router.push("/cardholder");
    else router.push("/dashboard");
  };

  if (loadingUser) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Checking session…</p>
      </main>
    );
  }

  if (!user) {
    return null; // redirected to /auth
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          border: "1px solid #333",
          borderRadius: 16,
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
          Welcome to Runesse
        </h1>
        <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#aaa" }}>
          Just a few details to set up your account.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Full name
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            Mobile number
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
              }}
            />
          </label>

          <fieldset style={{ border: "none", marginTop: 16, padding: 0 }}>
            <legend style={{ marginBottom: 8 }}>How will you use Runesse?</legend>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="BUYER"
                  checked={role === "BUYER"}
                  onChange={() => setRole("BUYER")}
                />{" "}
                I am a Buyer
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="CARDHOLDER"
                  checked={role === "CARDHOLDER"}
                  onChange={() => setRole("CARDHOLDER")}
                />{" "}
                I am a Cardholder
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="BOTH"
                  checked={role === "BOTH"}
                  onChange={() => setRole("BOTH")}
                />{" "}
                I am both Buyer and Cardholder
              </label>
            </div>
          </fieldset>

          {errorMsg && (
            <p style={{ color: "tomato", marginTop: 12 }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "0.7rem",
              borderRadius: 999,
              border: "none",
              background: "white",
              color: "black",
              fontWeight: 600,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default OnboardingPage;
