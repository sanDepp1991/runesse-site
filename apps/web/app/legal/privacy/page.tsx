"use client";

import React from "react";

const PrivacyPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Privacy Policy
      </h1>

      <div className="space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse prioritizes your privacy. We collect only the information
          necessary to facilitate secure verification and smooth functioning of
          transactions. This may include screenshots, payment proofs, profile
          details, and device information.
        </p>

        <p>
          Your data is never sold or shared with third parties except where
          required for platform security, legal compliance, or verification
          processes.
        </p>

        <p>
          Screenshots and proofs uploaded to Runesse are used solely for
          verification and fraud prevention. We apply tamper detection,
          metadata checks, OCR extraction, and internal validation to ensure the
          integrity of transactions.
        </p>

        <p>
          Runesse may use anonymized data for analytics, product improvement,
          and security enhancement. None of this data contains personally
          identifiable information.
        </p>

        <p>
          You may request data deletion at any time, after which your
          identifiable data will be removed except where retention is required
          by law.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
