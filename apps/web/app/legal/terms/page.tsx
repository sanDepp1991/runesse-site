export default function TermsPage() {
  return (
    <div
      className="min-h-screen bg-black text-white px-6 md:px-20 py-20 leading-relaxed"
      style={{ fontFamily: '"Century Gothic", sans-serif' }}
    >
      <h1 className="text-3xl md:text-4xl font-light mb-10">
        Terms & Conditions
      </h1>

      <div className="space-y-8 text-neutral-300 text-sm md:text-base">
        <p>
          Welcome to Runesse. By accessing or using the Runesse platform, you
          agree to the following terms and conditions. Please read them
          carefully. Continued use of the platform signifies your acceptance of
          these terms.
        </p>

        <p>
          Runesse acts as a facilitation platform that connects users who wish
          to avail debit/credit card offers with users who hold the required
          card. In Phase-1, all payments and reimbursements occur outside the
          application after verification.
        </p>

        <p>
          Users are responsible for providing accurate information,
          non-tampered screenshots, valid payment proofs, and all required
          details to ensure smooth verification. Any misuse, fraudulent
          activity, or attempt to manipulate the platform will result in
          immediate suspension.
        </p>

        <p>
          Runesse reserves the right to modify, update, or remove any feature,
          offer, or flow within the application at any time. Continued use after
          updates constitutes acceptance of the revised terms.
        </p>

        <p>
          By using Runesse, you acknowledge that it is a facilitator and not the
          payer, card issuer, or merchant. Runesse does not guarantee offer
          availability, merchant acceptance, or card network approval.
        </p>

        <p>
          If you do not agree with these terms, you may stop using the platform
          at any time.
        </p>
      </div>
    </div>
  );
}
