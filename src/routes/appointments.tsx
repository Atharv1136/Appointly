import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock, MapPin, RotateCw, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import type { AppointmentType, Booking } from "@/lib/types";
import { listServices } from "@/server/services.functions";
import { myBookings, cancelBooking, rescheduleBooking, getSlots, type SlotInfo } from "@/server/bookings.functions";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "My appointments — Appointly" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<AppointmentType[]>([]);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    const [bk, sv] = await Promise.all([myBookings(), listServices()]);
    setBookings(bk.bookings as Booking[]);
    setServices(sv.services as AppointmentType[]);
    setLoaded(true);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    void refresh();
  }, [user, authLoading, navigate]);

  const findService = (id: string) => services.find((s) => s.id === id);

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => new Date(b.slotStart).getTime() > now && b.status !== "cancelled")
    .sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  const past = bookings
    .filter((b) => new Date(b.slotStart).getTime() <= now || b.status === "cancelled")
    .sort((a, b) => b.slotStart.localeCompare(a.slotStart));

  const cancel = async (b: Booking) => {
    try {
      await cancelBooking({ data: { id: b.id } });
      toast.success("Booking cancelled");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!user) return null;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">My appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your upcoming and past bookings.</p>
        </div>

        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6 space-y-3">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming appointments"
                  body="Browse services and book a slot in seconds."
                  cta={<Button asChild><Link to="/services">Browse services</Link></Button>}
                />
              ) : (
                upcoming.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    service={findService(b.appointmentTypeId)}
                    onReschedule={() => setReschedule(b)}
                    onCancel={() => cancel(b)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6 space-y-3">
              {past.length === 0 ? (
                <EmptyState title="No past appointments" body="Your booking history will appear here." />
              ) : (
                past.map((b) => <BookingCard key={b.id} booking={b} service={findService(b.appointmentTypeId)} past />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {reschedule && (
        <RescheduleDialog
          booking={reschedule}
          service={findService(reschedule.appointmentTypeId)}
          onClose={() => setReschedule(null)}
          onDone={async () => {
            setReschedule(null);
            await refresh();
          }}
        />
      )}
    </PageShell>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <CalendarCheck className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/30",
    confirmed: "bg-success/15 text-success border-success/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function BookingCard({
  booking,
  service,
  past,
  onReschedule,
  onCancel,
}: {
  booking: Booking;
  service?: AppointmentType;
  past?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
}) {
  const provider = service?.providers.find((p) => p.id === booking.providerId);
  const date = new Date(booking.slotStart);

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card ${past ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{service?.title ?? "Appointment"}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{service?.organiser}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-muted-foreground" /> {date.toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> {provider?.name ?? "—"}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {past ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/book/$id" params={{ id: booking.appointmentTypeId }}>Book again</Link>
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onReschedule}><RotateCw className="h-3.5 w-3.5" /> Reschedule</Button>
              <Button size="sm" variant="ghost" onClick={onCancel} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RescheduleDialog({
  booking,
  service,
  onClose,
  onDone,
}: {
  booking: Booking;
  service?: AppointmentType;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!service) return;
    getSlots({ data: { appointmentTypeId: service.id, providerId: booking.providerId, dateISO: date.toISOString() } })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]));
  }, [service, booking.providerId, date]);

  const filteredSlots = useMemo(() => slots, [slots]);

  if (!service) return null;

  const confirm = async () => {
    if (!slotIso) return;
    setBusy(true);
    try {
      await rescheduleBooking({ data: { id: booking.id, slotStartISO: slotIso } });
      toast.success("Booking rescheduled");
      onDone();
    } catch (e) {
      toast.error((e as Error).message || "Could not reschedule");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">New date</label>
            <input
              type="date"
              value={date.toISOString().slice(0, 10)}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Pick a new time</div>
            {filteredSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots available.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {filteredSlots.map((s) => (
                  <button
                    key={s.iso}
                    disabled={!s.available}
                    onClick={() => setSlotIso(s.iso)}
                    className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                      slotIso === s.iso
                        ? "border-primary bg-primary text-primary-foreground"
                        : s.available
                          ? "border-border hover:border-primary"
                          : "cursor-not-allowed bg-muted text-muted-foreground line-through"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          {service.organiser && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {service.organiser}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={!slotIso || busy}>{busy ? "Saving..." : "Confirm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
