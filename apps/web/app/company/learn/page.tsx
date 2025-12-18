"use client";

import React from "react";

export default function LearnMorePage() {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Learn more about Runesse
      </h1>

      <div className="max-w-4xl space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse is a simple and trusted way to use any card offer—
          whether it’s a debit card or a credit card—even if you don’t own
          that card. Every day, great discounts go unused because the right
          card isn’t available at the right moment. Runesse connects people
          who want to use an offer with someone who already has the required
          card, making the benefit accessible to everyone.
        </p>

        <p>
          The vision of Runesse is to create a world where card power is
          shared instead of wasted. A world where offers flow to the person
          who needs them, cardholders earn from the value their cards create,
          and every transaction is built on trust and clarity. Runesse wants
          to unlock the full potential of every card, not just for one
          person, but for the entire community.
        </p>

        <p>
          Runesse works in a simple way. You find the offer you want, upload
          your details, and add the discounted amount along with the required
          charges. After a quick verification, a cardholder helps complete
          the payment. Once their proof is verified, the reimbursement
          happens smoothly. Every step is transparent, with checks in place
          so both sides feel safe and confident.
        </p>

        <p>
          In the coming stages, Runesse will introduce escrow to hold funds
          securely until everything is verified, AI to detect tampering or
          mismatches automatically, and a blockchain layer for tamper-proof
          transparency. Eventually, Runesse will appear right inside checkout
          pages, helping you choose the smartest offer instantly. Runesse
          keeps things simple, transparent, and built on trust—so everyone
          can save, earn, and benefit together.
        </p>
      </div>
    </div>
  );
}
