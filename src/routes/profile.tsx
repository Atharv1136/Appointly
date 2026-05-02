import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Phone, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Appointly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const save = () => {
    login({ ...user, name, phone });
    toast.success("Profile updated");
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">{initials}</span>
            <div>
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-primary">{user.role}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="n"><UserIcon className="mr-1 inline h-3.5 w-3.5" /> Full name</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p"><Phone className="mr-1 inline h-3.5 w-3.5" /> Phone</Label>
              <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label><Mail className="mr-1 inline h-3.5 w-3.5" /> Email</Label>
              <Input value={user.email} disabled />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={save}>Save changes</Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
