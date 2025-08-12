'use client'
import React, { useMemo, useState } from 'react'
import { Bell, Send, ShieldCheck, Wallet } from 'lucide-react'
import { Nav, Footer } from '@/components/ui'
import { formatNumber, formatCurrencyINR } from '@/lib/format'

const MOCK_OFFERS = [
  { id: 1, brand: 'Tanishq', category: 'Jewellery', card: 'HDFC Diners Black', discount: 25, cap: 25000, minSpend: 100000, expires: '2025-09-30' },
  { id: 2, brand: 'Croma', category: 'Electronics', card: 'SBI Card Elite', discount: 10, cap: 5000, minSpend: 40000, expires: '2025-10-15' },
  { id: 3, brand: 'Myntra', category: 'Fashion', card: 'AMEX MRCC', discount: 20, cap: 3000, minSpend: 10000, expires: '2025-08-31' },
  { id: 4, brand: 'MakeMyTrip', category: 'Travel', card: 'ICICI Amazon Pay', discount: 15, cap: 7000, minSpend: 25000, expires: '2025-09-10' },
  { id: 5, brand: 'Titan', category: 'Watches', card: 'Kotak Privy League', discount: 25, cap: 25000, minSpend: 100000, expires: '2025-09-30' },
]

export default function Page() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [selected, setSelected] = useState<any>(null)
  const [notif, setNotif] = useState<any[]>([])
  const [wallet, setWallet] = useState({ balance: 100000, locked: 0 })

  const filtered = useMemo(() => {
    return MOCK_OFFERS.filter(o =>
      (cat === 'All' || o.category === cat) &&
      (query.trim() === '' || o.brand.toLowerCase().includes(query.toLowerCase()) || o.card.toLowerCase().includes(query.toLowerCase()))
    )
  }, [query, cat])

  const handleRequest = (offer: any) => {
    const benefit = Math.min(offer.minSpend * (offer.discount / 100), offer.cap)
    const platformFee = Math.round(benefit * 0.10)
    const lock = offer.minSpend + platformFee
    if (wallet.balance - wallet.locked < lock) {
      alert('Insufficient available balance to lock for this request.')
      return
    }
    setSelected({ offer, benefit, platformFee, lock })
  }

  const confirmLock = () => {
    if (!selected) return
    setWallet(w => ({ ...w, locked: w.locked + selected.lock }))
    const n = { id: Date.now(), type: 'request', text: `Request placed for ${selected.offer.brand} via ${selected.offer.card}. Locked ₹${formatNumber(selected.lock)}.`, status: 'pending' }
    setNotif([n, ...notif])
    setSelected(null)
  }

  const approveLatest = () => {
    const pending = notif.find(n => n.status === 'pending')
    if (!pending) return
    const updated = notif.map(n => n.id === pending.id ? { ...n, status: 'approved', text: n.text.replace('pending', 'approved') } : n)
    setNotif(updated)

    const off = MOCK_OFFERS[0]
    const benefit = Math.min(off.minSpend * (off.discount / 100), off.cap)
    const platformFee = Math.round(benefit * 0.10)
    const payout = off.minSpend + platformFee
    const rewardToCardholder = Math.round(platformFee * 0.5)

    setWallet(w => ({ balance: w.balance - payout, locked: Math.max(0, w.locked - (off.minSpend + platformFee)) }))
    setNotif(n => [
      { id: Date.now() + 1, type: 'payment', status: 'done', text: `Payment executed at merchant. Reimbursed cardholder ₹${(formatNumber(off.minSpend))}.` },
      { id: Date.now() + 2, type: 'reward', status: 'done', text: `Cardholder reward credited ₹${formatNumber(rewardToCardholder)}.` },
      ...n,
    ])
  }

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <Nav active="demo" />
      <section className="bg-[#0b0d12]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Demo — MVP-style flow</h2>
              <p className="text-white/70">Browse offers, place a request, lock funds, and simulate an approval & payout.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <div className="text-sm">Wallet</div>
              <div className="mt-1 text-xl font-semibold">₹{(formatNumber(wallet.balance - wallet.locked))} <span className="text-sm text-white/60">available</span></div>
              <div className="text-sm text-white/70">Locked: ₹{formatNumber(wallet.locked)}</div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
                <div className="flex flex-wrap items-center gap-3">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brand or card (e.g., Tanishq, AMEX)" className="w-full flex-1 min-w-[220px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-indigo-400" />
                  <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400">
                    {['All','Jewellery','Electronics','Fashion','Travel','Watches'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {filtered.map(o => (
                    <div key={o.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold">{o.brand} <span className="text-white/60">· {o.category}</span></div>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white">{o.discount}% off</span>
                      </div>
                      <div className="mt-1 text-sm text-white/70">Via: {o.card}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
                        <div>Cap: ₹{formatNumber(o.cap)}</div>
                        <div>Min spend: ₹{formatNumber(o.minSpend)}</div>
                        <div>Expires: {o.expires}</div>
                      </div>
                      <button onClick={() => setSelected(o)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400">
                        <Send size={16} /> Request offer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
                <div className="flex items-center gap-2 text-white/90"><Bell size={16} /> Notifications</div>
                <div className="mt-2 space-y-2 text-sm">
                  {notif.length === 0 ? <div className="text-white/60">No notifications yet.</div> : notif.map(n => (
                    <div key={n.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/90">{n.text}</span>
                        <span className="ml-2 rounded-full px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300">pending</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  setNotif(n => [{ id: Date.now(), text: 'Payment executed at merchant. Reimbursed cardholder ₹1,00,000.', status: 'done' }, ...n])
                  setWallet(w => ({ balance: w.balance - 102500, locked: Math.max(0, w.locked - 102500) }))
                }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400">
                  <ShieldCheck size={16} /> Simulate approval & payout
                </button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
                <div className="flex items-center gap-2 text-white/90"><Wallet size={16} /> Wallet math</div>
                <p className="mt-2 text-sm text-white/70">When you request an offer, we lock <b>min spend + 10% of benefit</b>. After approval, we pay the cardholder and release rewards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}