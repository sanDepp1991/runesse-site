"use client";

import React from "react";

const SupportPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Support
      </h1>

      <div className="max-w-4xl space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse Support is here to help you navigate the platform—whether you
          are a buyer looking to use an offer or a cardholder helping complete a
          transaction.
        </p>

        <p>
          During Phase-1, every transaction is reviewed manually after proof
          upload. This ensures both sides have clarity before reimbursement and
          helps build a strong foundation of trust.
        </p>

        <p>
          If you face any issue, are unsure about a step, or want clarification
          on a verification outcome, you can write to us and we will review it.
        </p>

        <p>
          For assistance, please contact:
          <br />
          <span className="text-white text-lg md:text-xl">
            support@runesse.com
          </span>
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
