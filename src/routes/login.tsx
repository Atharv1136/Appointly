import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Appointly" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Mock login — accept any credentials
      const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      login({ id: "u_" + email, name: name || "Friend", email, role: "customer" });
      toast.success("Welcome back!");
      navigate({ to: "/services" });
    }, 500);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your appointments">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
