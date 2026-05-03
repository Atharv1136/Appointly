import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Download, MapPin, Minus, Plus, User as UserIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { AppointmentType, Provider } from "@/lib/types";
import { getService } from "@/server/services.functions";
import { getSlots, createBookingFn, getEarliestSlot, type SlotInfo } from "@/server/bookings.functions";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/server/payments.functions";

export const Route = createFileRoute("/book/$id")({
  head: () => ({ meta: [{ title: "Book appointment — CalenSync" }] }),
  validateSearch: (s: Record<string, unknown>): { token?: string } =>
    typeof s.token === "string" && s.token ? { token: s.token } : {},
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ params, deps }) => {
    const { service } = await getService({ data: { id: params.id, shareToken: deps.token } });
    return { service };
  },
  component: BookingPage,
});

const STEPS = ["Provider", "Date", "Slot", "Details", "Confirm", "Done"];

function BookingPage() {
  const { service } = Route.useLoaderData();
  const appt = service as AppointmentType;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Auth gate — booking requires sign-in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to book an appointment");
      navigate({ to: "/login", search: { redirect: `/book/${appt.id}` } });
    }
  }, [authLoading, user, navigate, appt.id]);

  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<Provider | null>(appt.providers[0] ?? null);
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(1);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Fetch slots when provider/date changes
  useEffect(() => {
    if (!provider) return;
    setSlotsLoading(true);
    getSlots({ data: { appointmentTypeId: appt.id, providerId: provider.id, dateISO: date.toISOString() } })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [appt.id, provider, date]);

  const subtotal = appt.advancePayment ? appt.paymentAmount * capacity : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finalizeBooking = async (paymentId?: string, razorpayOrderId?: string) => {
    if (!provider || !slotIso) return;
    try {
      const res = await createBookingFn({
        data: {
          appointmentTypeId: appt.id,
          providerId: provider.id,
          slotStartISO: slotIso,
          capacityCount: capacity,
          customerName: name,
          customerEmail: email,
          answers,
          paymentId,
          razorpayOrderId,
        },
      });
      setBookingId(res.id);
      setStep(5);
    } catch (e) {
      const msg = (e as Error).message || "Could not complete booking";
      toast.error(msg);
      if (msg.includes("no longer available")) {
        setStep(2);
        setSlotIso(null);
        // Refresh slots
        if (provider) {
          const r = await getSlots({ data: { appointmentTypeId: appt.id, providerId: provider.id, dateISO: date.toISOString() } });
          setSlots(r.slots);
        }
      }
    }
  };

  const submit = async () => {
    if (!user) {
      toast.error("Please log in to confirm your booking");
      navigate({ to: "/login" });
      return;
    }
    if (!appt.advancePayment) {
      await finalizeBooking();
      return;
    }
    setSubmitting(true);
    try {
      const order = await createRazorpayOrder({
        data: { appointmentTypeId: appt.id, capacityCount: capacity },
      });
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amount,
        currency: order.currency,
        name: appt.title,
        description: `${appt.organiser} · ${provider!.name}`,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
      });
      await verifyRazorpayPayment({ data: result });
      toast.success("Payment successful");
      await finalizeBooking(result.razorpay_payment_id, result.razorpay_order_id);
    } catch (e) {
      toast.error((e as Error).message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">Checking your session...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/services" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{appt.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{appt.organiser} · {appt.durationMins} min</p>
        </div>

        {/* Progress */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/15" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary-soft p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Zap className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">Quick book</div>
                    <p className="text-xs text-muted-foreground">Pick a date — we'll auto-assign the earliest available time and skip straight to your details.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={date.toISOString().slice(0, 10)}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => e.target.value && setDate(new Date(e.target.value))}
                    className="sm:w-56"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const r = await getEarliestSlot({
                          data: { appointmentTypeId: appt.id, capacityCount: capacity, dateISO: date.toISOString() },
                        });
                        const prov = appt.providers.find((p) => p.id === r.providerId) ?? appt.providers[0];
                        setProvider(prov);
                        const d = new Date(r.iso);
                        setDate(d);
                        setSlotIso(r.iso);
                        toast.success(`Earliest slot: ${d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`);
                        setStep(3);
                      } catch (e) {
                        toast.error((e as Error).message || "No slots available");
                      }
                    }}
                  >
                    <Zap className="h-4 w-4" /> Quick book this date
                  </Button>
                </div>
              </div>

              <h2 className="text-lg font-semibold">Or choose a provider</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {appt.providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      provider?.id === p.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{p.initials}</span>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.title}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={next} disabled={!provider}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pick a date</h2>
              <MiniCalendar value={date} onChange={setDate} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Available times</h2>
                <span className="text-sm text-muted-foreground">{date.toDateString()}</span>
              </div>

              {appt.manageCapacity && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-sm font-medium">People:</span>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCapacity((c) => Math.max(1, c - 1))}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{capacity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCapacity((c) => Math.min(appt.maxCapacity, c + 1))}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">Max {appt.maxCapacity} per slot</span>
                </div>
              )}

              {slotsLoading ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Loading slots...</p>
              ) : slots.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No slots configured for this day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((s) => {
                    const enough = s.remaining >= capacity;
                    const enabled = s.available && enough;
                    return (
                      <button
                        key={s.iso}
                        disabled={!enabled}
                        onClick={() => setSlotIso(s.iso)}
                        className={`relative rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                          slotIso === s.iso
                            ? "border-primary bg-primary text-primary-foreground"
                            : enabled
                              ? "border-border hover:border-primary hover:bg-primary-soft"
                              : "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                        }`}
                      >
                        {s.time}
                        {appt.manageCapacity && enabled && (
                          <span className="absolute -right-1 -top-1 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-semibold text-success-foreground">{s.remaining}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={next} disabled={!slotIso}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e">Email</Label>
                  <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="p">Phone</Label>
                  <Input
                    id="p"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="^[+]?[0-9\s\-()]{7,20}$"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s\-()]/g, ""))}
                    placeholder="+91 ..."
                  />
                </div>
              </div>

              {appt.questions.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">A few questions</h3>
                  {appt.questions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label>{q.label}{q.required && <span className="ml-1 text-destructive">*</span>}</Label>
                      {q.type === "text" && (
                        <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      )}
                      {q.type === "textarea" && (
                        <Textarea value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      )}
                      {q.type === "select" && (
                        <Select value={answers[q.id] ?? ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {q.options?.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={() => {
                  if (!name || !email) return toast.error("Name and email are required");
                  const digits = phone.replace(/\D/g, "");
                  if (digits.length < 7 || digits.length > 15) return toast.error("Please enter a valid phone number");
                  for (const q of appt.questions) if (q.required && !answers[q.id]) return toast.error(`Please answer: ${q.label}`);
                  next();
                }}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Review your booking</h2>
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5">
                  <Row icon={UserIcon} label="Provider" value={provider?.name ?? ""} />
                  <Row icon={CalendarCheck} label="Date" value={new Date(slotIso!).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
                  <Row icon={Clock} label="Time" value={`${new Date(slotIso!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${appt.durationMins} min`} />
                  {appt.manageCapacity && <Row icon={UserIcon} label="People" value={String(capacity)} />}
                  <Row icon={MapPin} label="Venue" value={appt.organiser} />
                </div>
                {appt.manualConfirm && (
                  <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                    This booking requires manual confirmation by the organiser.
                  </p>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold">Order summary</h3>
                  {appt.advancePayment ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{tax}</span></div>
                      <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>₹{total}</span></div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No payment required to book.</p>
                  )}
                </div>
                <Button onClick={submit} className="w-full" disabled={submitting}>
                  {submitting ? "Processing..." : appt.advancePayment ? <><CreditCard className="h-4 w-4" /> Pay ₹{total}</> : "Confirm booking"}
                </Button>
                <Button variant="ghost" onClick={back} className="w-full">Back</Button>
              </aside>
            </div>
          )}

          {step === 5 && bookingId && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold">{appt.manualConfirm ? "Booking reserved" : "Booking confirmed!"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {appt.manualConfirm ? "We'll email you once the organiser confirms." : "We've emailed you the details."}
              </p>

              <div className="mt-6 w-full max-w-md space-y-3 rounded-xl border border-border bg-muted/30 p-5 text-left">
                <Row icon={CalendarCheck} label="Date" value={new Date(slotIso!).toLocaleDateString()} />
                <Row icon={Clock} label="Time" value={new Date(slotIso!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                <Row icon={UserIcon} label="Provider" value={provider?.name ?? ""} />
                <p className="text-xs text-muted-foreground">Booking ID: {bookingId}</p>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild><Link to="/appointments">View appointments</Link></Button>
                <Button asChild variant="outline"><Link to="/services">Book another</Link></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function MiniCalendar({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const monthLabel = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = new Date(view.getFullYear(), view.getMonth(), i + 1);
          const past = d < today;
          const selected = d.toDateString() === value.toDateString();
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onChange(d)}
              className={`aspect-square rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : past
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "hover:bg-primary-soft hover:text-primary"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
