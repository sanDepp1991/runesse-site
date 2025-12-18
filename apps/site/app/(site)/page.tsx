'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight, Shield, LockKeyhole, BadgePercent, CheckCircle2, IndianRupee, Store, Users, Mail, Globe, Phone } from 'lucide-react'
import { Nav, Pill, Footer } from '@/components/ui'

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <Nav active="landing" />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,#1a2240,transparent_60%),radial-gradient(circle_at_90%_10%,#0b6b7a,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Pill><ShieldCheck size={14} /> RBI-guided compliant flows (design-ready)</Pill>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Unlock every credit card offer — <span className="text-cyan-300">even without owning the card</span>
              </h1>
              <p className="mt-4 max-w-xl text-white/80">
                Runesse lets users leverage card-specific offers via trusted cardholders. A secure shared-wallet flow reimburses the cardholder instantly while the buyer enjoys the discount.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#join" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-zinc-900">
                  <ArrowRight size={18} /> Join the waitlist
                </a>
                <a href="/demo" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10">
                  <ArrowRight size={18} /> See live demo
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-white/70">
                <Pill><Shield size={14} /> KYC-first community</Pill>
                <Pill><LockKeyhole size={14} /> Escrow-style wallet</Pill>
                <Pill><BadgePercent size={14} /> Transparent splits</Pill>
              </div>
            </div>
            <motion.div initial={{ opacity:0, y: 20 }} whileInView={{ opacity:1, y:0}} transition={{ duration: .5}} viewport={{ once: true}} className="relative">
              <div className="mx-auto aspect-video w-full max-w-xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 shadow-2xl">
                <div className="grid h-full grid-cols-3 gap-3">
                  {['Browse Offers','Request','Approve'].map((s,i)=> (
                    <div key={i} className="rounded-2xl bg-black/40 p-4 text-white/80">
                      <div className="text-sm font-semibold">{s}</div>
                      <div className="mt-3 h-24 rounded-xl bg-white/5" />
                      <div className="mt-3 h-2 w-2/3 rounded-full bg-white/10" />
                      <div className="mt-1 h-2 w-1/2 rounded-full bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0d12]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">How Runesse works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[{title:'Discover Offers', desc:'See live deals available via community cardholders — filtered by brand, card type, and spend.'}, {title:'Request & Lock', desc:'Request an offer. Your wallet locks the payable amount; the cardholder gets a notification.'}, {title:'Pay & Reimburse', desc:'Cardholder pays at the merchant. Your escrow reimburses them instantly — you keep the discount.'}].map((s,i)=> (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10" />
                <div className="mt-3 text-lg font-semibold">{s.title}</div>
                <p className="mt-2 text-white/80">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-white">Why users love Runesse</h3>
              <p className="mt-2 max-w-xl text-white/80">No hacks. No grey areas. Just real card offers executed by verified cardholders, with a transparent wallet flow and instant reimbursements.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'Bigger savings', desc: 'Tap premium card offers without owning the card.' },
                  { title: 'Secure escrow', desc: 'Funds lock until the cardholder pays and proof is verified.' },
                  { title: 'Win–win community', desc: 'Cardholders earn a share of the benefit for helping you.' },
                  { title: 'Merchant friendly', desc: 'True card charge at POS; no coupon leakage or misuse.' },
                ].map((c,i)=> (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
                    <div className="flex items-center gap-2 text-white/90"><span className="font-semibold">{c.title}</span></div>
                    <p className="mt-1 text-white/70">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
              <div className="text-lg font-semibold">Transparent math (example)</div>
              <ul className="mt-3 space-y-2 text-white/80">
                <li>Watch MRP ₹1,00,000; Offer 25% via Cardholder → Buyer pays ₹75,000</li>
                <li>Platform fee = 10% of benefit (₹25,000) → ₹2,500</li>
                <li>Split: 50% rewards to cardholder (₹1,250), 50% platform (₹1,250)</li>
                <li>Total from buyer’s wallet = ₹75,000 + ₹2,500 = ₹77,500</li>
              </ul>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">* Illustrative. Final fees/flows depend on RBI rules, KYC, and merchant category controls.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="bg-[#0b0d12]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold text-white">Get early access</h3>
                <p className="mt-2 text-white/80">Join the waitlist and be the first to try Runesse when the beta opens.</p>
              </div>
              <form className="rounded-2xl border border-white/10 bg-black/30 p-4" method="POST" action="/api/subscribe">
                <label className="block text-sm text-white/80">Email</label>
                <input name="email" required placeholder="you@domain.com" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400" />
                <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400">Join waitlist</button>
                <p className="mt-2 text-xs text-white/60">We’ll only email about the beta. No spam.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
