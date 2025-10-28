import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Runesse — Unlock every card offer',
  description: 'Leverage card-specific offers via trusted cardholders with secure wallet reimbursements.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        {/* Google Analytics (optional) — replace G-XXXX with your ID */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" /> */}
        {/* <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXX');
        `}} /> */}
        {/* Plausible (optional) — replace data-domain */}
        {/* <script defer data-domain="runesse.in" src="https://plausible.io/js/script.js"></script> */}
      </body>
    </html>
  )
}
