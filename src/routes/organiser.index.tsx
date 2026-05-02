import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Briefcase, Calendar, CheckCircle2, Clock, Layers, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminListBookings, adminUpdateBookingStatus, organiserStats } from "@/server/admin.functions";
import { listServices } from "@/server/services.functions";
import type { AppointmentType } from "@/lib/types";

export const Route = createFileRoute("/organiser/")({
  head: () => ({ meta: [{ title: "Organiser dashboard — Appointly" }] }),
  component: () => (
    <RoleGuard allow={["organiser", "admin"]}>
      <OrganiserDashboard />
    </RoleGuard>
  ),
});

type Stats = Awaited<ReturnType<typeof organiserStats>>;
type BookingRow = Awaited<ReturnType<typeof adminListBookings>>["bookings"][number];

function OrganiserDashboard() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Organiser dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your bookings, services and reports</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">My services</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="bookings"><BookingsTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value, tone = "primary" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { organiserStats().then(setStats).catch((e) => toast.error((e as Error).message)); }, []);
  if (!stats) return <p className="text-sm text-muted-foreground">Loading...</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Calendar} label="Total bookings" value={stats.totalBookings} />
      <StatCard icon={CheckCircle2} label="Confirmed" value={stats.confirmed} tone="success" />
      <StatCard icon={Clock} label="Pending" value={stats.pending} tone="warning" />
      <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} tone="danger" />
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<AppointmentType[]>([]);
  const [status, setStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const refresh = () => {
    adminListBookings({ data: { status } }).then((r) => setBookings(r.bookings)).catch((e) => toast.error((e as Error).message));
  };
  useEffect(() => { listServices().then((r) => setServices(r.services as AppointmentType[])); }, []);
  useEffect(() => { refresh(); }, [status]);

  const update = async (id: string, st: "pending" | "confirmed" | "cancelled") => {
    try {
      await adminUpdateBookingStatus({ data: { id, status: st } });
      toast.success("Updated");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={(v) => setStatus(v as "all" | "pending" | "confirmed" | "cancelled")}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3">{new Date(b.slotStart).toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{serviceMap.get(b.appointmentTypeId)?.title ?? b.appointmentTypeId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.customerName}</div>
                  <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "confirmed" ? "bg-success/15 text-success" :
                    b.status === "pending" ? "bg-warning/15 text-warning" :
                    "bg-destructive/15 text-destructive"
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {b.status === "pending" && <Button size="sm" onClick={() => update(b.id, "confirmed")}>Confirm</Button>}
                    {b.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => update(b.id, "cancelled")}>Cancel</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServicesTab() {
  const [services, setServices] = useState<AppointmentType[]>([]);
  useEffect(() => { listServices().then((r) => setServices(r.services as AppointmentType[])); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.category}</span>
          </div>
          <h3 className="font-semibold">{s.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div>Duration: <span className="font-medium text-foreground">{s.durationMins} min</span></div>
            <div>Hours: <span className="font-medium text-foreground">{s.workingHours.start}–{s.workingHours.end}</span></div>
            <div>Providers: <span className="font-medium text-foreground">{s.providers.length}</span></div>
            {s.advancePayment && <div>Price: <span className="font-medium text-foreground">₹{s.paymentAmount}</span></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<AppointmentType[]>([]);
  useEffect(() => {
    organiserStats().then(setStats).catch((e) => toast.error((e as Error).message));
    listServices().then((r) => setServices(r.services as AppointmentType[]));
  }, []);
  if (!stats) return <p className="text-sm text-muted-foreground">Loading reports...</p>;

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const maxHour = Math.max(1, ...stats.byHour.map((h) => h.count));
  const maxSvc = Math.max(1, ...stats.byService.map((s) => s.count));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" /> Peak booking hours</h3>
        {stats.byHour.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="flex h-40 items-end gap-1">
            {Array.from({ length: 24 }).map((_, h) => {
              const item = stats.byHour.find((x) => x.hour === h);
              const c = item?.count ?? 0;
              return (
                <div key={h} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm bg-primary/70" style={{ height: `${(c / maxHour) * 100}%`, minHeight: c ? 3 : 0 }} title={`${h}:00 — ${c}`} />
                  {h % 3 === 0 && <span className="text-[9px] text-muted-foreground">{h}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 text-sm font-semibold">Top services</h3>
        {stats.byService.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="space-y-2">
            {stats.byService.map((s) => (
              <div key={s.serviceId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{serviceMap.get(s.serviceId)?.title ?? s.serviceId}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${(s.count / maxSvc) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
