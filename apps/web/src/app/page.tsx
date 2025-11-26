"use client";

import React from "react";
import Link from "next/link";

const LandingPage: React.FC = () => {
  const [showStoryOverlay, setShowStoryOverlay] = React.useState(false);
  const [storyActive, setStoryActive] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [showMobileCardOverlay, setShowMobileCardOverlay] =
    React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Open full-screen story
  const handleLearnMoreClick = () => {
    setShowStoryOverlay(true);
    setStoryActive(false);

    // Start glow + movement after 1 second
    setTimeout(() => {
      setStoryActive(true);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 1000);
  };

  // Close full-screen story and reset to card
  const handleCloseStory = () => {
    setShowStoryOverlay(false);
    setStoryActive(false);
    setShowMobileCardOverlay(false); // go back to card on mobile
  };

  // Detect mobile by viewport width
  React.useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // On mobile: first scroll → show overlay (same idea as hover)
  React.useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      if (!showMobileCardOverlay && !showStoryOverlay && window.scrollY > 10) {
        setShowMobileCardOverlay(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, showMobileCardOverlay, showStoryOverlay]);

  // Close overlay on Esc
  React.useEffect(() => {
    if (!showStoryOverlay) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseStory();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showStoryOverlay]);

  // Desktop only: gentle auto-scroll when mouse near top/bottom
  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;

    const el = scrollRef.current;
    if (!el) return;

    const height = window.innerHeight || el.clientHeight;
    const y = e.clientY;

    const bottomThreshold = height * 0.8;
    const topThreshold = height * 0.2;

    if (y > bottomThreshold) {
      el.scrollBy({ top: 2, behavior: "smooth" });
    } else if (y < topThreshold) {
      el.scrollBy({ top: -2, behavior: "smooth" });
    }
  };

  // On mobile: first touch-move over main content reveals the text overlay
  const handleMainTouchMove = () => {
    if (isMobile && !showMobileCardOverlay && !showStoryOverlay) {
      setShowMobileCardOverlay(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-6 md:px-16 py-4">
        <div className="text-xl font-semibold tracking-widest">RUNESSE</div>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/auth/signin"
            className="text-sm mr-2 hover:underline"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition"
          >
            Sign up
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full border border-blue-500/70 text-blue-300 text-sm hover:bg-blue-500/10 transition"
          >
            Admin
          </Link>
        </nav>
      </header>

      {/* Centered Content */}
      <main
        className="flex-1 flex flex-col items-center justify-center px-6 pb-24 min-h-[110vh]"
        onTouchMove={handleMainTouchMove}
      >
        {/* Tagline above card */}
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-6 text-center">
          SIMPLE · TRANSPARENT · TRUST
        </p>

        {/* Card container */}
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-sm aspect-[16/10] group">
            {/* Card front */}
            <div
              className={`
                absolute inset-0
                rounded-3xl
                bg-gradient-to-br from-neutral-900 via-black to-neutral-950
                border border-white/10
                shadow-xl shadow-black/50
                overflow-hidden
                cursor-pointer
                transition-all
                duration-500
                ${
                  showMobileCardOverlay
                    ? "opacity-0 -translate-y-2 scale-[1.02] border-white/40"
                    : "opacity-100"
                }
                md:group-hover:opacity-0
                md:group-hover:-translate-y-2
                md:group-hover:scale-[1.02]
                md:group-hover:border-white/40
              `}
            >
              {/* Card top glossy layer */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-tr from-white/5 via-transparent to-white/10
                  opacity-60
                  md:group-hover:opacity-0
                  transition-opacity duration-500
                "
              />

              {/* Card inner content */}
              <div className="relative h-full flex flex-col justify-between p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs tracking-[0.25em] uppercase text-neutral-400">
                    Credit Access
                  </span>
                  <span className="text-xs text-neutral-500">
                    Runesse Network
                  </span>
                </div>

                <div className="flex-1" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base tracking-[0.25em]">
                      ●●●● ●●●● ●●●● 4827
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500">
                    <span>VALID THRU 10/30</span>
                    <span>CARD LINKED · LIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover overlay (desktop) + mobile overlay */}
            <div
              className={`
                absolute inset-0
                flex items-center justify-center
                transition-opacity duration-300
                ${
                  showMobileCardOverlay
                    ? "opacity-100"
                    : "opacity-0 md:group-hover:opacity-100"
                }
              `}
            >
              {/* NO border / card box — just text */}
              <div className="px-6 py-8 text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Save More. Earn More.
                </h2>

                <p className="text-neutral-300 text-sm mb-4">
                  With the power of every card — in one place.
                </p>

                <button
                  className="px-4 py-2 rounded-full border border-white/30 text-sm text-white hover:border-white transition"
                  onClick={handleLearnMoreClick}
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Full-screen Learn More story overlay */}
      {showStoryOverlay && (
        <div
          className="
            fixed inset-0 bg-black text-white z-50
            flex flex-col
          "
          onMouseMove={handleOverlayMouseMove}
        >
          {/* Close button – fixed in viewport */}
          <button
            className="fixed top-4 right-4 text-xl text-neutral-500 hover:text-white transition z-50"
            onClick={handleCloseStory}
            aria-label="Close story"
          >
            ×
          </button>

          {/* Scrollable content area */}
          <div
            ref={scrollRef}
            className="
              flex-1
              overflow-y-auto
              px-6 md:px-16
              pt-16 md:pt-24
            "
          >
            <div
              className={`
                max-w-5xl
                text-2xl md:text-4xl
                leading-relaxed md:leading-relaxed
                text-left
                font-light
                transform
                transition-all
                duration-[3000ms]
                ${storyActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
              `}
              style={{
                fontFamily:
                  '"Century Gothic", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                color: storyActive
                  ? "rgba(255,255,255,0.96)"
                  : "rgba(148,163,184,0.25)",
                textShadow: storyActive
                  ? "0 0 22px rgba(255,255,255,0.3)"
                  : "0 0 6px rgba(0,0,0,0.7)",
                transition:
                  "opacity 3s ease, transform 3s ease, color 3s ease, text-shadow 3s ease",
              }}
            >
              <p className="mb-8">
                Runesse is a simple and trusted way to use any card offer—whether
                it’s a debit card or a credit card—even if you don’t own that
                card. Every day, great discounts go unused because the right card
                isn’t available at the right moment. Runesse connects people who
                want to use an offer with someone who already has the required
                card, making the benefit accessible to everyone.
              </p>

              <p className="mb-8">
                The vision of Runesse is to create a world where card power is
                shared instead of wasted. A world where offers flow to the person
                who needs them, cardholders earn from the value their cards
                create, and every transaction is built on trust and clarity.
                Runesse wants to unlock the full potential of every card, not just
                for one person, but for the entire community.
              </p>

              <p className="mb-8">
                Runesse works in a simple way. You find the offer you want, upload
                your details, and add the discounted amount along with the
                required charges. After a quick verification, a cardholder helps
                complete the payment. Once their proof is verified, the
                reimbursement happens smoothly. Every step is transparent, with
                checks in place so both sides feel safe and confident.
              </p>

              <p className="mb-10">
                In the coming stages, Runesse will introduce escrow to hold funds
                securely until everything is verified, AI to detect tampering or
                mismatches automatically, and a blockchain layer for tamper-proof
                transparency. Eventually, Runesse will appear right inside
                checkout pages, helping you choose the smartest offer instantly.
                Runesse keeps things simple, transparent, and built on trust—so
                everyone can save, earn, and benefit together.
              </p>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 mt-12">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-8 py-8 md:py-10 text-xs md:text-sm text-neutral-400">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-12">
          {/* Brand + message */}
          <div className="space-y-2 max-w-sm">
            <div className="text-base md:text-lg font-semibold tracking-[0.25em] text-white">
              RUNESSE
            </div>
            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed">
              Save more. Earn more.  
              The power of every card — in one place.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 md:gap-12">
            <div className="space-y-2">
              <div className="text-neutral-300 font-medium text-xs md:text-sm">
                Company
              </div>
              <ul className="space-y-1">
                <li>
                  <a
                    href="/company/about"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/company/learn"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Learn more
                  </a>
                </li>
                <li>
                  <a
                    href="/company/contact"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/company/support"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-neutral-300 font-medium text-xs md:text-sm">
                Legal
              </div>
              <ul className="space-y-1">
                <li>
                  <a
                    href="/legal/terms"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Terms &amp; Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/privacy"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/refunds"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Refund &amp; Cancellation
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/safety"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Verification &amp; Safety
                  </a>
                </li>
                <li>
                  <a
                    href="/legal/liability"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Platform Liability
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-neutral-300 font-medium text-xs md:text-sm">
                Connect
              </div>
              <ul className="space-y-1">
                <li>
                  <a
                    href="https://www.instagram.com/runesse.official/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/109941004/admin/dashboard/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/Runesse_site"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/profile.php?id=61583798105120"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-200 transition-colors"
                  >
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[10px] md:text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} Runesse. All rights reserved.</div>
          <div>
            Runesse is a facilitation platform. Payments and reimbursements in
            Phase-1 happen outside the app, after verification.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
