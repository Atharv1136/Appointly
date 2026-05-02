import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/appointly-logo.png";

function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={logoImg}
      alt="Appointly logo"
      className={`${className} object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}
    />
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-base font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Appointly</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Services
          </Link>
          {user && (
            <Link to="/appointments" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              My Appointments
            </Link>
          )}
          {user?.role === "organiser" && (
            <Link to="/organiser" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="text-sm font-medium text-primary transition-colors hover:text-primary/80" activeProps={{ className: "text-primary" }}>
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </Link>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className="text-sm font-medium">Home</Link>
            <Link to="/services" onClick={() => setOpen(false)} className="text-sm font-medium">Services</Link>
            {user ? (
              <>
                <Link to="/appointments" onClick={() => setOpen(false)} className="text-sm font-medium">My Appointments</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium">Profile</Link>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup" onClick={() => setOpen(false)}>Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
        <div className="group flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="text-sm font-medium">Appointly</span>
          <span className="text-sm text-muted-foreground">— The perfect booking system</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Appointly. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-base font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Appointly</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProtectedHint() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      You need an account to continue. <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link> or <Link to="/signup" className="font-medium text-primary hover:underline">sign up</Link>.
    </div>
  );
}

export { UserIcon };
