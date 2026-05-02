
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
