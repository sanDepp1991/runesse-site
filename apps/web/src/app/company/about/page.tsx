"use client";

import React from "react";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        About Runesse
      </h1>

      <div className="max-w-4xl space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse is a simple and trusted way to access debit and credit card
          offers—even if you don’t own the card. Every day, valuable offers go
          unused because the right card isn’t available at the right moment.
          Runesse connects buyers who want to use an offer with cardholders who
          already have the required card, making savings accessible to everyone.
        </p>

        <p>
          Our vision is to create a world where card power is shared instead of
          wasted. A world where offers flow to the person who needs them,
          cardholders earn from the value their cards create, and every
          transaction happens with transparency and trust.
        </p>

        <p>
          Runesse is built to unlock the full potential of every card—not just
          for one person, but for the entire community. With secure processes,
          verification layers, and a user-first design, Runesse aims to shift
          how people benefit from card-linked offers.
        </p>

        <p>
          As we grow, Runesse will introduce escrow for secure fund holding,
          blockchain for tamper-proof transparency, and AI verification for
          fraud-free experiences. This is just the beginning.
        </p>
      </div>
    </div>
  );
}
