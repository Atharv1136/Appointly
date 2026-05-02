import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify OTP — Appointly" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.some((d) => !d)) return toast.error("Enter the 6-digit code");
    const pending = sessionStorage.getItem("apt_pending_signup");
    const u = pending ? JSON.parse(pending) : { name: "Friend", email: "user@example.com", role: "customer" };
    sessionStorage.removeItem("apt_pending_signup");
    login({ id: "u_" + u.email, name: u.name, email: u.email, role: u.role });
    toast.success("Account verified!");
    navigate({ to: "/services" });
  };

  const resend = () => {
    setCountdown(60);
    setDigits(["", "", "", "", "", ""]);
    toast.success("New OTP sent");
  };

  return (
    <AuthShell title="Verify your email" subtitle="We sent a 6-digit code to your inbox">
      <form onSubmit={verify} className="space-y-6">
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              maxLength={1}
              inputMode="numeric"
              className="h-14 w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          ))}
        </div>
        <Button type="submit" className="w-full">Verify</Button>
        <p className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <>Resend in {countdown}s</>
          ) : (
            <button type="button" onClick={resend} className="font-medium text-primary hover:underline">
              Resend OTP
            </button>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
