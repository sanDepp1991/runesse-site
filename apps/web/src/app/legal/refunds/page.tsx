"use client";

import React from "react";

const RefundsPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Refund & Cancellation
      </h1>

      <div className="space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          In Phase-1, Runesse does not handle or store payment funds directly.
          All reimbursements and refunds occur outside the application between
          the buyer, the cardholder, and the merchant.
        </p>

        <p>
          If a merchant reverses a transaction, the buyer will receive the
          refunded amount exactly as credited by the merchant. Platform charges
          already paid may not be refundable unless specified otherwise.
        </p>

        <p>
          Runesse will assist in verifying proofs and supporting
          communication between the buyer and cardholder, but it does not
          intervene in bank-level refund timelines.
        </p>

        <p>
          Once Phase-2 (Escrow) is enabled, the refund and settlement rules will
          follow the escrow provider’s policies, which will be published prior
          to rollout.
        </p>
      </div>
    </div>
  );
};

export default RefundsPage;
