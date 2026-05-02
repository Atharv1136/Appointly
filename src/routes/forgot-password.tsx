import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Appointly" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we sent a password reset link.
          </p>
          <Button asChild variant="ghost" className="mt-6">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
