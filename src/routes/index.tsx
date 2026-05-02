import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CreditCard, Shield, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout";
import { listServices } from "@/server/services.functions";
import type { AppointmentType } from "@/lib/types";
import heroImg from "@/assets/hero-booking.jpg";
import logoImg from "@/assets/appointly-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Appointly — Book appointments in seconds" },
      { name: "description", content: "Discover services, pick a time, and pay securely. The perfect booking system for customers and organisers." },
      { property: "og:title", content: "Appointly — Book appointments in seconds" },
      { property: "og:description", content: "Discover services, pick a time, and pay securely." },
    ],
  }),
  loader: async () => {
    const { services } = await listServices();
    return { services: (services as AppointmentType[]).slice(0, 4) };
  },
  component: Landing,
});

function Landing() {
  const { services } = Route.useLoaderData();

  return (
    <PageShell>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-accent/40 blur-3xl animate-blob delay-300" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5" /> The perfect booking system
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in-up delay-100">
              Book your next appointment in <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent animate-gradient-pan">seconds</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg animate-fade-in-up delay-200">
              Discover services, pick a slot that works for you, and confirm instantly. No phone tag, no waiting — just a clean, modern booking experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-in-up delay-300">
              <Button asChild size="lg" className="h-12 px-6 text-base shadow-elevated transition-transform hover:scale-[1.03]">
                <Link to="/services">
                  Browse services <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/signup">Create free account</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground animate-fade-in-up delay-500">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Secure payments</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Instant confirmation</div>
              <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> Easy reschedule</div>
            </div>
          </div>

          <div className="relative animate-fade-in delay-200">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/10 blur-3xl animate-float-slow" />
            <img src={heroImg} alt="Calendar with floating appointment slots" width={1536} height={1024} className="rounded-2xl border border-border shadow-elevated transition-transform duration-500 hover:scale-[1.02]" />
            <img src={logoImg} alt="" aria-hidden className="absolute -left-6 -top-6 hidden h-20 w-20 rounded-2xl bg-background p-2 shadow-elevated animate-float-slow sm:block" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to book</h2>
          <p className="mt-3 text-muted-foreground">Built for customers and organisers. Designed to feel effortless.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarCheck, title: "Smart scheduling", body: "Real-time availability with conflict prevention so you never double-book." },
            { icon: CreditCard, title: "Razorpay payments", body: "Collect advance payments securely with Razorpay test & live modes." },
            { icon: Users, title: "Capacity management", body: "Group classes? We handle multi-person slots with remaining-seat counts." },
            { icon: Zap, title: "Instant confirmation", body: "Auto-confirm or manual approval — your choice, per service." },
            { icon: Shield, title: "Secure by default", body: "Authentication and OTP verification keep accounts safe." },
            { icon: Sparkles, title: "Reschedule in 2 clicks", body: "Customers can move their booking without an email thread." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="card-lift animate-fade-in-up rounded-2xl border border-border bg-card p-6 shadow-card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Popular services</h2>
              <p className="mt-2 text-muted-foreground">Pick a service and book a slot in under a minute.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/services">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s: AppointmentType, i: number) => (
              <Link
                key={s.id}
                to="/book/$id"
                params={{ id: s.id }}
                className="card-lift group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{s.category}</span>
                  <span className="text-xs text-muted-foreground">{s.durationMins} min</span>
                </div>
                <h3 className="text-base font-semibold leading-tight transition-colors group-hover:text-primary">{s.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">{s.organiser}</span>
                  <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-1">Book →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border p-10 sm:p-14" style={{ background: "var(--gradient-primary)" }}>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">Ready to start booking?</h2>
              <p className="mt-3 text-primary-foreground/80">Create a free account and book your first appointment in seconds.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
                <Link to="/signup">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-primary-foreground/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/services">See services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
