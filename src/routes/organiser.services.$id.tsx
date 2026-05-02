import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Link2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMyService, updateService, deleteService, togglePublish,
  addProvider, updateProvider, removeProvider,
  addQuestion, updateQuestion, removeQuestion,
  generateShareToken,
} from "@/server/organiser.functions";

export const Route = createFileRoute("/organiser/services/$id")({
  head: () => ({ meta: [{ title: "Edit service — Appointly" }] }),
  component: () => (
    <RoleGuard allow={["organiser", "admin"]}>
      <EditServicePage />
    </RoleGuard>
  ),
});

type Service = Awaited<ReturnType<typeof getMyService>>["service"];

function EditServicePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [svc, setSvc] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => getMyService({ data: { id } }).then((r) => setSvc(r.service)).catch((e) => toast.error((e as Error).message));
  useEffect(() => { load(); }, [id]);

  if (!svc) return <PageShell><div className="mx-auto max-w-4xl p-8 text-sm text-muted-foreground">Loading…</div></PageShell>;

  const save = async () => {
    setSaving(true);
    try {
      await updateService({
        data: {
          id: svc.id,
          title: svc.title,
          description: svc.description,
          category: svc.category,
          organiserLabel: svc.organiser,
          durationMins: svc.durationMins,
          currency: svc.currency,
          manageCapacity: svc.manageCapacity,
          maxCapacity: svc.maxCapacity,
          advancePayment: svc.advancePayment,
          paymentAmount: svc.paymentAmount,
          manualConfirm: svc.manualConfirm,
          workingStart: svc.workingHours.start,
          workingEnd: svc.workingHours.end,
          minLeadMins: svc.minLeadMins,
          maxAdvanceDays: svc.maxAdvanceDays,
          bufferMins: svc.bufferMins,
          isPublished: svc.isPublished,
        },
      });
      toast.success("Saved");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await deleteService({ data: { id: svc.id } });
      toast.success("Service deleted");
      navigate({ to: "/organiser" });
    } catch (e) { toast.error((e as Error).message); }
  };

  const togglePub = async (v: boolean) => {
    setSvc({ ...svc, isPublished: v });
    try { await togglePublish({ data: { id: svc.id, published: v } }); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/organiser" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={svc.isPublished} onCheckedChange={togglePub} id="pub" />
              <Label htmlFor="pub" className="text-sm">{svc.isPublished ? "Published" : "Unpublished"}</Label>
            </div>
            <Button variant="outline" onClick={remove} className="text-destructive"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
            <Button onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-semibold">{svc.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">Configure how customers see and book this service.</p>

        <ShareLinkCard service={svc} onChange={load} />

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="hours">Hours & rules</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input value={svc.title} onChange={(e) => setSvc({ ...svc, title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={svc.description} onChange={(e) => setSvc({ ...svc, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Category</Label>
                  <Input value={svc.category} onChange={(e) => setSvc({ ...svc, category: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Business name shown to customers</Label>
                  <Input value={svc.organiser} onChange={(e) => setSvc({ ...svc, organiser: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label>Duration (min)</Label>
                  <Select value={String(svc.durationMins)} onValueChange={(v) => setSvc({ ...svc, durationMins: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Currency</Label>
                  <Input value={svc.currency} onChange={(e) => setSvc({ ...svc, currency: e.target.value.toUpperCase() })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Price</Label>
                  <Input type="number" value={svc.paymentAmount} onChange={(e) => setSvc({ ...svc, paymentAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                <div><div className="text-sm font-medium">Require advance payment</div><div className="text-xs text-muted-foreground">Customers must pay before booking is confirmed</div></div>
                <Switch checked={svc.advancePayment} onCheckedChange={(v) => setSvc({ ...svc, advancePayment: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                <div><div className="text-sm font-medium">Manual confirmation</div><div className="text-xs text-muted-foreground">You approve each booking before it's confirmed</div></div>
                <Switch checked={svc.manualConfirm} onCheckedChange={(v) => setSvc({ ...svc, manualConfirm: v })} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours">
            <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Working hours start</Label>
                  <Input type="time" value={svc.workingHours.start} onChange={(e) => setSvc({ ...svc, workingHours: { ...svc.workingHours, start: e.target.value } })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Working hours end</Label>
                  <Input type="time" value={svc.workingHours.end} onChange={(e) => setSvc({ ...svc, workingHours: { ...svc.workingHours, end: e.target.value } })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                <div><div className="text-sm font-medium">Group bookings</div><div className="text-xs text-muted-foreground">Allow multiple people per slot</div></div>
                <Switch checked={svc.manageCapacity} onCheckedChange={(v) => setSvc({ ...svc, manageCapacity: v })} />
              </div>
              {svc.manageCapacity && (
                <div className="grid gap-1.5">
                  <Label>Max people per slot</Label>
                  <Input type="number" value={svc.maxCapacity} onChange={(e) => setSvc({ ...svc, maxCapacity: Number(e.target.value) })} />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label>Min lead time (min)</Label>
                  <Input type="number" value={svc.minLeadMins} onChange={(e) => setSvc({ ...svc, minLeadMins: Number(e.target.value) })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Max advance (days)</Label>
                  <Input type="number" value={svc.maxAdvanceDays} onChange={(e) => setSvc({ ...svc, maxAdvanceDays: Number(e.target.value) })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Buffer between (min)</Label>
                  <Input type="number" value={svc.bufferMins} onChange={(e) => setSvc({ ...svc, bufferMins: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="providers">
            <ProvidersEditor service={svc} onChange={load} />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsEditor service={svc} onChange={load} />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

function ProvidersEditor({ service, onChange }: { service: Service; onChange: () => void }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    try { await addProvider({ data: { serviceId: service.id, name, title, initials: "" } }); setName(""); setTitle(""); onChange(); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="space-y-2">
        {service.providers.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{p.initials}</div>
            <Input className="flex-1" defaultValue={p.name} onBlur={(e) => updateProvider({ data: { id: p.id, serviceId: service.id, name: e.target.value, title: p.title, initials: "" } }).then(onChange).catch((err) => toast.error((err as Error).message))} />
            <Input className="flex-1" defaultValue={p.title} placeholder="Title" onBlur={(e) => updateProvider({ data: { id: p.id, serviceId: service.id, name: p.name, title: e.target.value, initials: "" } }).then(onChange).catch((err) => toast.error((err as Error).message))} />
            <Button size="sm" variant="ghost" onClick={() => removeProvider({ data: { id: p.id, serviceId: service.id } }).then(onChange).catch((err) => toast.error((err as Error).message))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border pt-4">
        <Input placeholder="Provider name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Title (e.g. Senior Stylist)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </div>
    </div>
  );
}

function QuestionsEditor({ service, onChange }: { service: Service; onChange: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"text" | "textarea" | "select">("text");
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState("");

  const add = async () => {
    if (!label.trim()) return;
    const options = type === "select" ? optionsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    try {
      await addQuestion({ data: { serviceId: service.id, label, type, options, required } });
      setLabel(""); setOptionsStr(""); setRequired(false);
      onChange();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="space-y-2">
        {service.questions.map((q) => (
          <div key={q.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Input className="flex-1" defaultValue={q.label} onBlur={(e) => updateQuestion({ data: { id: q.id, serviceId: service.id, label: e.target.value, type: q.type, options: q.options ?? [], required: q.required } }).then(onChange).catch((err) => toast.error((err as Error).message))} />
            <span className="rounded bg-muted px-2 py-1 text-xs">{q.type}{q.required && " · required"}</span>
            <Button size="sm" variant="ghost" onClick={() => removeQuestion({ data: { id: q.id, serviceId: service.id } }).then(onChange).catch((err) => toast.error((err as Error).message))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {service.questions.length === 0 && <p className="text-sm text-muted-foreground">No custom questions yet.</p>}
      </div>
      <div className="grid gap-2 border-t border-border pt-4">
        <Input placeholder="Question label (e.g. First time visiting?)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v as "text" | "textarea" | "select")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Short text</SelectItem>
              <SelectItem value="textarea">Long text</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
            </SelectContent>
          </Select>
          {type === "select" && (
            <Input className="flex-1" placeholder="Options (comma-separated)" value={optionsStr} onChange={(e) => setOptionsStr(e.target.value)} />
          )}
          <label className="flex items-center gap-2 text-sm"><Switch checked={required} onCheckedChange={setRequired} /> Required</label>
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div>
      </div>
    </div>
  );
}

function ShareLinkCard({ service, onChange }: { service: Service; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = service.shareToken ? `${origin}/book/${service.id}?token=${service.shareToken}` : "";

  const generate = async () => {
    setBusy(true);
    try {
      await generateShareToken({ data: { id: service.id, enable: true } });
      toast.success(service.shareToken ? "New share link generated" : "Share link created");
      onChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!confirm("Disable the share link? Anyone with the old link will lose access.")) return;
    setBusy(true);
    try {
      await generateShareToken({ data: { id: service.id, enable: false } });
      toast.success("Share link disabled");
      onChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    catch { toast.error("Could not copy link"); }
  };

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-primary" /> Private share link
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this service privately, even when unpublished. Anyone with the link can book.
          </p>
        </div>
        {service.shareToken ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generate} disabled={busy}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={disable} disabled={busy}>
              Disable
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={generate} disabled={busy}>
            <Link2 className="mr-1 h-3.5 w-3.5" /> Generate link
          </Button>
        )}
      </div>
      {service.shareToken && (
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
      )}
    </div>
  );
}
