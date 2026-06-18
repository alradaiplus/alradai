import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import {
  Infinity as InfinityIcon,
  Sparkles,
  Share2,
  ArrowRight,
  Layers,
  Search,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-canvas-bg text-ink">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5 text-accent">
          <LogoMark size={34} />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-ink">Notes Canvas</div>
            <div className="text-[11px] text-ink-faint">Your Visual Second Brain</div>
          </div>
        </div>
        <Link
          href="/app"
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-hover"
        >
          Open app
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-16 text-center md:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-canvas-border bg-canvas-surface px-3 py-1 text-[12px] text-ink-muted">
          <Sparkles size={13} className="text-accent" /> AI that understands you
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          All your knowledge.
          <br />
          <span className="bg-gradient-to-r from-accent to-node-image bg-clip-text text-transparent">
            One infinite canvas.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] text-ink-muted md:text-lg">
          Notes Canvas is a visual second brain. Capture notes, images and ideas
          on an infinite canvas, connect them into a living knowledge graph, and
          ask an AI that actually knows your thinking.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14px] font-medium text-white transition hover:bg-accent-hover"
          >
            Start thinking <ArrowRight size={16} />
          </Link>
          <Link
            href="/app/graph"
            className="inline-flex items-center gap-2 rounded-xl border border-canvas-border px-5 py-3 text-[14px] font-medium text-ink-muted transition hover:text-ink"
          >
            See the graph
          </Link>
        </div>
      </section>

      {/* Preview frame */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-canvas-border bg-canvas-surface shadow-panel">
          <div className="flex items-center gap-1.5 border-b border-canvas-border px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-canvas-elevated" />
            <span className="h-3 w-3 rounded-full bg-canvas-elevated" />
            <span className="h-3 w-3 rounded-full bg-canvas-elevated" />
          </div>
          <div
            className="grid h-[360px] place-items-center bg-canvas-bg"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-accent">
                <LogoMark size={56} />
              </span>
              <p className="text-[13px] text-ink-faint">
                Your infinite canvas lives here →{" "}
                <Link href="/app" className="text-accent-hover underline">
                  open it
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-20 max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<InfinityIcon size={20} />}
            title="Infinite Canvas"
            body="Pan, zoom and place notes, images and embeds anywhere. Your ideas are never boxed into a list."
          />
          <Feature
            icon={<Sparkles size={20} />}
            title="AI that understands you"
            body="Ask questions and get answers grounded in your own notes, with citations that link back to the canvas."
          />
          <Feature
            icon={<Share2 size={20} />}
            title="Built for thinkers"
            body="Wikilinks, backlinks and a living knowledge graph turn scattered notes into connected understanding."
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Feature icon={<Layers size={20} />} title="Every kind of node" body="Notes, images, files, links and 3D embeds — all first-class on the canvas." />
          <Feature icon={<Search size={20} />} title="Hybrid search" body="⌘K finds anything with full-text + semantic search across your whole workspace." />
          <Feature icon={<Share2 size={20} />} title="Knowledge graph" body="Zoom out to a force-directed map of everything you know and how it connects." />
        </div>
      </section>

      <footer className="mx-auto mt-24 max-w-6xl px-6 py-10 text-center text-[12px] text-ink-faint">
        Notes Canvas — Your Visual Second Brain
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-canvas-border bg-canvas-surface p-5 transition hover:border-accent-ring">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
