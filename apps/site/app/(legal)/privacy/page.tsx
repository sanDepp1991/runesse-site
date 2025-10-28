import fs from 'node:fs'
import path from 'node:path'
import { Nav, Footer } from '@/components/ui'

function Markdown({ content }: { content: string }) {
  return <article className="prose prose-invert max-w-3xl">{content.split('\n').map((l,i)=> <p key={i}>{l}</p>)}</article>
}

export default function Page() {
  const file = fs.readFileSync(path.join(process.cwd(), 'app/(legal)/privacy/page.md'), 'utf8')
  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <Nav active="landing" />
      <main className="mx-auto max-w-7xl px-4 py-16 text-white"><Markdown content={file} /></main>
      <Footer />
    </div>
  )
}
