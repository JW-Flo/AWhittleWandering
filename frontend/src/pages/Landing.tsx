import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api } from "@/lib/api-config";

type TripHeartbeat = {
  state?: string;
  daysElapsed?: number;
  statesVisited?: number;
  totalStates?: number;
};

const Landing: React.FC = () => {
  useDocumentTitle("Home");
  const [heartbeat, setHeartbeat] = useState<TripHeartbeat | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api.baseUrl}/api/v1/unified-data`, { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setHeartbeat({
          state: data?.currentStatus?.location?.state,
          daysElapsed: data?.overview?.daysElapsed,
          statesVisited: data?.overview?.statesVisited,
          totalStates: data?.overview?.totalStates,
        });
      } catch {
        // Silent — landing works without heartbeat
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="journey-typography min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 pt-8">
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/dashboard">Journeyer dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm"
          style={{
            backgroundImage:
              "radial-gradient(1200px circle at 20% 20%, hsl(var(--accent) / 0.18), transparent 60%), radial-gradient(900px circle at 80% 30%, hsl(var(--primary) / 0.18), transparent 55%), radial-gradient(800px circle at 50% 80%, hsl(var(--foreground) / 0.05), transparent 60%)",
          }}
        >
          <div className="relative z-10 px-6 py-14 md:px-12 md:py-20">
            <div className="max-w-3xl">
              <p className="text-sm text-muted-foreground">A place for journeys that matter</p>
              <h1 className="mt-4 text-5xl md:text-6xl leading-[1.05] font-semibold tracking-tight">
                A Whittle Wandering
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Movement into meaning: coherent shape, presence, and memory—experienced by others in
                real time, and held afterward as a narrative.
              </p>

              {heartbeat?.state && (
                <p className="mt-4 text-sm text-foreground/70">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                  Day {heartbeat.daysElapsed ?? "—"} — currently in {heartbeat.state}
                  {typeof heartbeat.statesVisited === "number" && typeof heartbeat.totalStates === "number"
                    ? ` (${heartbeat.statesVisited} of ${heartbeat.totalStates} states)`
                    : ""}
                </p>
              )}

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button asChild className="h-12 px-6 justify-between">
                  <Link to="/journey/live">
                    <span>Follow the journey</span>
                    <span className="text-primary-foreground/70">&rarr;</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-6 justify-between">
                  <Link to="/demo">
                    <span>See a demo</span>
                    <span className="text-muted-foreground">&rarr;</span>
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                No charts. No feeds. Just the arc of the journey—revealed in meaningful segments and
                moments.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
