import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Calendar, CheckCircle2, IndianRupee, ShieldCheck, Users, Briefcase, Layers, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminStats,
  adminListUsers,
  adminSetUserActive,
  adminSetUserRole,
  adminListBookings,
  adminUpdateBookingStatus,
} from "@/server/admin.functions";
import { listServices } from "@/server/services.functions";
import type { AppointmentType } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin panel — CalenSync" }] }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <AdminPanel />
    </RoleGuard>
  ),
});

type Stats = Awaited<ReturnType<typeof adminStats>>;
type UserRow = Awaited<ReturnType<typeof adminListUsers>>["users"][number];
type BookingRow = Awaited<ReturnType<typeof adminListBookings>>["bookings"][number];

function AdminPanel() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin panel</h1>
            <p className="text-sm text-muted-foreground">Platform overview & management</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="bookings"><BookingsTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
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

function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    adminStats().then(setStats).catch((e) => toast.error((e as Error).message));
  }, []);
  if (!stats) return <p className="text-sm text-muted-foreground">Loading stats...</p>;

  const max = Math.max(1, ...stats.trend.map((t) => t.count));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={Briefcase} label="Organisers" value={stats.totalOrganisers} tone="primary" />
        <StatCard icon={Calendar} label="Total bookings" value={stats.totalBookings} tone="success" />
        <StatCard icon={IndianRupee} label="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} tone="success" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CheckCircle2} label="Confirmed" value={stats.confirmedBookings} tone="success" />
        <StatCard icon={Clock} label="Pending" value={stats.pendingBookings} tone="warning" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelledBookings} tone="danger" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" /> Bookings — last 14 days</h3>
        {stats.trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings in this period yet.</p>
        ) : (
          <div className="flex h-36 items-end gap-2">
            {stats.trend.map((t) => (
              <div key={t.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all hover:from-primary hover:to-primary" style={{ height: `${(t.count / max) * 100}%`, minHeight: t.count ? 4 : 0 }} title={`${t.date}: ${t.count}`} />
                <span className="text-[10px] text-muted-foreground">{t.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => adminListUsers().then((r) => { setUsers(r.users); setLoading(false); }).catch((e) => toast.error((e as Error).message));
  useEffect(() => { refresh(); }, []);

  const toggle = async (u: UserRow) => {
    try {
      await adminSetUserActive({ data: { id: u.id, active: !u.isActive } });
      toast.success(u.isActive ? "User deactivated" : "User activated");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const setRole = async (u: UserRow, role: "customer" | "organiser" | "admin") => {
    try {
      await adminSetUserRole({ data: { id: u.id, role } });
      toast.success("Role updated");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading users...</p>;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3">
                <Select value={u.role} onValueChange={(v) => setRole(u, v as "customer" | "organiser" | "admin")}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="organiser">Organiser</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant={u.isActive ? "outline" : "default"} onClick={() => toggle(u)}>
                  {u.isActive ? "Deactivate" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<AppointmentType[]>([]);
  const [status, setStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [serviceId, setServiceId] = useState<string>("all");

  const refresh = () => {
    adminListBookings({ data: { status, serviceId: serviceId === "all" ? undefined : serviceId } })
      .then((r) => setBookings(r.bookings)).catch((e) => toast.error((e as Error).message));
  };
  useEffect(() => { listServices().then((r) => setServices(r.services as AppointmentType[])); }, []);
  useEffect(() => { refresh(); }, [status, serviceId]);

  const update = async (id: string, st: "pending" | "confirmed" | "cancelled") => {
    try {
      await adminUpdateBookingStatus({ data: { id, status: st } });
      toast.success("Booking updated");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | "pending" | "confirmed" | "cancelled")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
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
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.paymentStatus}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {b.status !== "confirmed" && (
                      <Button size="sm" variant="outline" onClick={() => update(b.id, "confirmed")}>Confirm</Button>
                    )}
                    {b.status !== "cancelled" && (
                      <Button size="sm" variant="outline" onClick={() => update(b.id, "cancelled")}>Cancel</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No bookings match these filters.</td></tr>
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
        <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.category}</span>
          </div>
          <h3 className="font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.organiser}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{s.durationMins} min</span>
            {s.advancePayment && <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs text-success">₹{s.paymentAmount}</span>}
            {s.manageCapacity && <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs text-primary">Cap {s.maxCapacity}</span>}
            {s.manualConfirm && <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs text-warning">Manual</span>}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{s.providers.length} provider{s.providers.length === 1 ? "" : "s"}</div>
        </div>
      ))}
    </div>
  );
}
