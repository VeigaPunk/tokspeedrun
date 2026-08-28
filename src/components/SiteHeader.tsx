import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { formatClock } from "@/lib/format";

/** Session stopwatch — starts at page load, ticks like pit-wall timing. */
function SessionClock() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="tnum font-mono text-xs text-muted-foreground tabular-nums">
      <span className="mr-2 text-[10px] uppercase tracking-widest text-muted-foreground/70">
        session
      </span>
      {formatClock(now - start)}
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs uppercase tracking-[0.18em] transition-colors ${
    isActive
      ? "text-primary"
      : "text-muted-foreground hover:text-foreground"
  }`;

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between px-[2vw]">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              TOK<span className="text-primary">SPEED</span>RUN
            </span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <NavLink to="/board" className={navLinkClass}>
              Board
            </NavLink>
            <NavLink to="/submit" className={navLinkClass}>
              Publish a run
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navLinkClass}>
                Steward
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <SessionClock />
          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="ghost-link text-xs uppercase tracking-[0.18em]"
            >
              {user?.name ?? "runner"} / out
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-accent"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
