import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Briefcase, Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, Edit, Eye, EyeOff, Layers, Plus, Trash2, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminListBookings, adminUpdateBookingStatus, organiserStats } from "@/server/admin.functions";
import { listServices } from "@/server/services.functions";
import { listMyServices, togglePublish, deleteService } from "@/server/organiser.functions";
import type { AppointmentType } from "@/lib/types";

export const Route = createFileRoute("/organiser/")({
  head: () => ({ meta: [{ title: "Organiser dashboard — CalenSync" }] }),
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
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">My services</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="schedule"><ScheduleTab /></TabsContent>
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
      <StatCard icon={CalendarIcon} label="Total bookings" value={stats.totalBookings} />
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

type MyService = Awaited<ReturnType<typeof listMyServices>>["services"][number];

function ServicesTab() {
  const [services, setServices] = useState<MyService[]>([]);
  const refresh = () => listMyServices().then((r) => setServices(r.services)).catch((e) => toast.error((e as Error).message));
  useEffect(() => { refresh(); }, []);

  const onTogglePublish = async (id: string, current: boolean) => {
    try { await togglePublish({ data: { id, published: !current } }); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try { await deleteService({ data: { id } }); toast.success("Deleted"); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{services.length} service{services.length === 1 ? "" : "s"}</p>
        <Button asChild><Link to="/organiser/services/new"><Plus className="mr-1 h-4 w-4" />New service</Link></Button>
      </div>
      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="mb-1 font-semibold">No services yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first service to start taking bookings.</p>
          <Button asChild><Link to="/organiser/services/new"><Plus className="mr-1 h-4 w-4" />Create service</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.category}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.isPublished ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {s.isPublished ? "Live" : "Draft"}
                </span>
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description || "—"}</p>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div>Duration: <span className="font-medium text-foreground">{s.durationMins} min</span></div>
                <div>Hours: <span className="font-medium text-foreground">{s.workingHours.start}–{s.workingHours.end}</span></div>
                <div>Providers: <span className="font-medium text-foreground">{s.providers.length}</span></div>
                {s.advancePayment && <div>Price: <span className="font-medium text-foreground">{s.currency} {s.paymentAmount}</span></div>}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/organiser/services/$id" params={{ id: s.id }}><Edit className="mr-1 h-3.5 w-3.5" />Edit</Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onTogglePublish(s.id, s.isPublished)} title={s.isPublished ? "Unpublish" : "Publish"}>
                  {s.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(s.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
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

function ScheduleTab() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<AppointmentType[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  useEffect(() => {
    adminListBookings({ data: { status: "all" } })
      .then((r) => setBookings(r.bookings))
      .catch((e) => toast.error((e as Error).message));
    listServices().then((r) => setServices(r.services as AppointmentType[]));
  }, []);

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  // Group bookings by YYYY-MM-DD
  const byDay = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const k = new Date(b.slotStart).toLocaleDateString("en-CA");
    const arr = byDay.get(k) ?? [];
    arr.push(b);
    byDay.set(k, arr);
  }

  const selectedKey = selected ? selected.toLocaleDateString("en-CA") : "";
  const dayBookings = (byDay.get(selectedKey) ?? []).sort(
    (a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime(),
  );

  const bookedDays = Array.from(byDay.keys()).map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold">
            {month.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ booked: bookedDays }}
          modifiersClassNames={{
            booked: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
          }}
          className="pointer-events-auto"
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Days with bookings
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {selected ? selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Pick a day"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {dayBookings.length} {dayBookings.length === 1 ? "booking" : "bookings"} scheduled
            </p>
          </div>
        </div>

        {dayBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bookings on this day.</p>
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-5">
            {dayBookings.map((b) => {
              const svc = serviceMap.get(b.appointmentTypeId);
              const start = new Date(b.slotStart);
              const end = new Date(start.getTime() + (svc?.durationMins ?? 30) * 60000);
              const tone =
                b.status === "confirmed" ? "bg-success/15 text-success border-success/30" :
                b.status === "pending" ? "bg-warning/15 text-warning border-warning/30" :
                "bg-destructive/15 text-destructive border-destructive/30";
              return (
                <li key={b.id} className="relative">
                  <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="mt-1 font-medium">{svc?.title ?? b.appointmentTypeId}</div>
                        <div className="text-sm text-muted-foreground">
                          {b.customerName} · {b.customerEmail}
                        </div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

