import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Appointly" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"customer" | "organiser">("customer");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Please fill all fields");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    sessionStorage.setItem("apt_pending_signup", JSON.stringify({ name, email, role }));
    setTimeout(() => {
      toast.success("OTP sent to your email");
      navigate({ to: "/verify-otp" });
    }, 500);
  };

  return (
    <AuthShell title="Create your account" subtitle="Start booking in under a minute">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpw">Confirm</Label>
            <Input id="cpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>I am a</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["customer", "organiser"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  role === r ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="text-sm font-medium capitalize">{r}</div>
                <div className="text-xs text-muted-foreground">
                  {r === "customer" ? "Book appointments" : "Offer services"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
