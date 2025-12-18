export default function LiabilityPage() {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Platform Liability
      </h1>

      <div className="space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Runesse is a facilitation platform. It does not issue cards, process
          payments, or influence merchant decisions. All financial transactions
          occur directly between buyers, cardholders, banks, and merchants.
        </p>

        <p>
          Runesse is not liable for declined payments, merchant cancellations,
          card issuer restrictions, bank delays, or user-uploaded incorrect
          information.
        </p>

        <p>
          Verification outcomes are based solely on the proofs provided. If
          tampered or mismatched proofs are detected, Runesse reserves the right
          to reject or halt a transaction.
        </p>

        <p>
          By using Runesse, you acknowledge that the platform is an intermediary
          and cannot be held responsible for losses arising from misuse,
          incorrect uploads, delays in merchant refunds, or external service
          failures.
        </p>
      </div>
    </div>
  );
}
