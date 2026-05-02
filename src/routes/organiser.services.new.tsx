import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createService } from "@/server/organiser.functions";

export const Route = createFileRoute("/organiser/services/new")({
  head: () => ({ meta: [{ title: "New service — Appointly" }] }),
  component: () => (
    <RoleGuard allow={["organiser", "admin"]}>
      <NewServicePage />
    </RoleGuard>
  ),
});

function NewServicePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    organiserLabel: "",
    durationMins: 30,
    currency: "INR",
    manageCapacity: false,
    maxCapacity: 1,
    advancePayment: false,
    paymentAmount: 0,
    manualConfirm: false,
    workingStart: "09:00",
    workingEnd: "17:00",
    minLeadMins: 60,
    maxAdvanceDays: 60,
    bufferMins: 0,
    isPublished: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Add a title");
    setBusy(true);
    try {
      const res = await createService({ data: form });
      toast.success("Service created");
      navigate({ to: "/organiser/services/$id", params: { id: res.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/organiser" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">Create a new service</h1>
        <p className="mb-6 text-sm text-muted-foreground">You can fine-tune providers and questions after creating it.</p>

        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="grid gap-1.5">
            <Label>Service title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 30-min Strategy Call" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What customers will get from this appointment" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Business name (shown to customers)</Label>
              <Input value={form.organiserLabel} onChange={(e) => set("organiserLabel", e.target.value)} placeholder="Defaults to your name" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label>Duration</Label>
              <Select value={String(form.durationMins)} onValueChange={(v) => set("durationMins", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </div>
            <div className="grid gap-1.5">
              <Label>Price</Label>
              <Input type="number" value={form.paymentAmount} onChange={(e) => set("paymentAmount", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Daily start time</Label>
              <Input type="time" value={form.workingStart} onChange={(e) => set("workingStart", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Daily end time</Label>
              <Input type="time" value={form.workingEnd} onChange={(e) => set("workingEnd", e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div><div className="text-sm font-medium">Require advance payment</div><div className="text-xs text-muted-foreground">Collect payment before confirming</div></div>
              <Switch checked={form.advancePayment} onCheckedChange={(v) => set("advancePayment", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div><div className="text-sm font-medium">Manual confirmation</div><div className="text-xs text-muted-foreground">You approve each booking</div></div>
              <Switch checked={form.manualConfirm} onCheckedChange={(v) => set("manualConfirm", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div><div className="text-sm font-medium">Group bookings</div><div className="text-xs text-muted-foreground">Allow multiple people in the same slot</div></div>
              <Switch checked={form.manageCapacity} onCheckedChange={(v) => set("manageCapacity", v)} />
            </div>
            {form.manageCapacity && (
              <div className="grid gap-1.5">
                <Label>Max people per slot</Label>
                <Input type="number" value={form.maxCapacity} onChange={(e) => set("maxCapacity", Number(e.target.value))} />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div><div className="text-sm font-medium">Publish immediately</div><div className="text-xs text-muted-foreground">Customers can find and book this service</div></div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create service"}</Button>
        </form>
      </div>
    </PageShell>
  );
}
