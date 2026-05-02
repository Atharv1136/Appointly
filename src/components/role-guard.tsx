import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/layout";

export function RoleGuard({ allow, children }: { allow: Array<"customer" | "organiser" | "admin">; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!allow.includes(user.role)) {
      navigate({ to: "/" });
    }
  }, [loading, user, allow, navigate]);

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </PageShell>
    );
  }
  return <>{children}</>;
}
