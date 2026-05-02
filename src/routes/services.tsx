import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { listServices } from "@/server/services.functions";
import type { AppointmentType } from "@/lib/types";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Browse services — Appointly" },
      { name: "description", content: "Browse all bookable services and pick a time that works for you." },
      { property: "og:title", content: "Browse services — Appointly" },
      { property: "og:description", content: "Browse all bookable services and book in seconds." },
    ],
  }),
  loader: async () => {
    const { services } = await listServices();
    return { services };
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { services } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [all] = useState<AppointmentType[]>(services as AppointmentType[]);
  useEffect(() => {}, []);
  const filtered = all.filter(
    (s) =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.organiser.toLowerCase().includes(q.toLowerCase()) ||
      s.category.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <PageShell>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Browse services</h1>
          <p className="mt-2 text-muted-foreground">Find the right service and book a slot.</p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by service, provider, or category"
              className="h-11 pl-10"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No services match "{q}".</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to="/book/$id"
                params={{ id: s.id }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{s.category}</span>
                  <span className="text-xs text-muted-foreground">{s.durationMins} min</span>
                </div>
                <h3 className="text-lg font-semibold leading-tight">{s.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.organiser}</p>
                    {s.advancePayment && (
                      <p className="mt-0.5 text-sm font-medium">
                        ₹{s.paymentAmount}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">advance</span>
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-primary group-hover:underline">Book →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
