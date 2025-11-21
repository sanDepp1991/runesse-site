"use client";

import React from "react";

const ContactPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Contact Us
      </h1>

      <div className="max-w-3xl space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          We wouldd love to hear from you. Whether you have a question, feedback, or
          want to explore a partnership with Runesse, you can reach us using the
          details below.
        </p>

        <div className="space-y-2">
          <p className="text-neutral-400 text-xs md:text-sm uppercase tracking-wide">
            Email
          </p>
          <p className="text-white text-lg md:text-xl">
            support@runesse.com
          </p>
        </div>

        <div className="space-y-2 pt-6">
          <p className="text-neutral-400 text-xs md:text-sm uppercase tracking-wide">
            Website
          </p>
          <p className="text-white text-lg md:text-xl">
            https://runesse.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
