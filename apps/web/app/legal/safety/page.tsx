"use client";

import React from "react";

const SafetyPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Verification & Safety
      </h1>

      <div className="space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse is built around trust and verification. Every transaction goes
          through a multi-step validation process that includes screenshot
          integrity checks, proof verification, metadata matching, and duplicate
          prevention.
        </p>

        <p>
          Buyers must upload genuine checkout screenshots and valid payment
          links. Cardholders must upload authentic merchant invoices and card
          debit proofs. Any tampering attempt will lead to suspension.
        </p>

        <p>
          In future phases, Runesse will introduce automated fraud detection,
          AI-based image forensics, and full audit trails via blockchain.
        </p>

        <p>
          User safety is our priority. Each action is recorded with timestamps
          and hashed proof data to ensure transparency and accountability.
        </p>
      </div>
    </div>
  );
};

export default SafetyPage;
