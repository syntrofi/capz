import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Shield, Code, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-24 sm:py-36 text-center">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Built on Base · Open source · Non-custodial
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Cap your profits.{" "}
            <span className="gradient-text">Share the rest.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Set a limit on what you keep. Automatically share everything above
            it — with your customers, contributors, and the projects that
            support your work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/app/setup">
              <Button size="lg" className="gap-2 text-base h-12 px-8 bg-primary hover:bg-primary/90">
                Set up your Capz account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/claim">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Claim earnings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three steps from setup to automatic redistribution.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Set your cap",
              description:
                "Choose a threshold — the maximum you'll keep in any given period. Revenue above that line belongs to your community, not your pocket.",
            },
            {
              step: "02",
              title: "Define your stakeholders",
              description:
                "Add wallets with percentage allocations: your most loyal customers, open-source projects you depend on, team members, or causes you care about.",
            },
            {
              step: "03",
              title: "Share your address",
              description:
                "Give buyers your Capz address instead of your personal wallet. Every payment is tracked, and when your cap is hit, redistribution happens automatically.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-border bg-card p-8"
            >
              <div className="mb-4 text-4xl font-bold text-primary/20 select-none">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why it matters ── */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              For everyone in the value chain
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Capz makes fairness structural, not optional.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                label: "Sellers",
                title: "Build trust at the protocol level",
                points: [
                  "Show customers their money is capped before they pay",
                  "No recurring admin — redistribution is automatic",
                  "Transparent on-chain record of every payment",
                ],
              },
              {
                icon: <Code className="h-5 w-5 text-accent" />,
                label: "Open source maintainers",
                title: "Funded by the projects that depend on you",
                points: [
                  "Receive a share from sellers who use your work",
                  "No grant applications, no negotiations",
                  "Composable — get included in any Capz account",
                ],
              },
              {
                icon: <Shield className="h-5 w-5 text-emerald-400" />,
                label: "Stakeholders",
                title: "Claim earnings at any time",
                points: [
                  "Your allocation is held on-chain until you claim",
                  "No trust required — rules are in the contract",
                  "Works with any EVM wallet",
                ],
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-8 flex flex-col gap-5"
              >
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium mb-4">
                    {card.icon}
                    {card.label}
                  </div>
                  <h3 className="text-xl font-semibold leading-snug">{card.title}</h3>
                </div>
                <ul className="space-y-3">
                  {card.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-sm text-muted-foreground">
            {[
              "Built on Base",
              "EIP-1167 minimal proxy",
              "Open source contracts",
              "Non-custodial",
              "No fees",
            ].map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="hidden sm:inline h-1 w-1 rounded-full bg-border" />
                )}
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to honor your values?
          </h2>
          <p className="text-muted-foreground text-lg">
            Set up your Capz account in under five minutes. Free, open source,
            and yours forever.
          </p>
          <Link href="/app/setup">
            <Button size="lg" className="h-12 px-10 text-base gap-2 bg-primary hover:bg-primary/90">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="font-bold text-primary text-base">capz</Link>
              <Link href="/app" className="hover:text-foreground transition-colors">App</Link>
              <Link href="/claim" className="hover:text-foreground transition-colors">Claim</Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by Ethereum · © {new Date().getFullYear()} Capz
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
