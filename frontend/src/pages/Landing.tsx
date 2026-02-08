import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/lib/api-config";

type HealthStatus = "checking" | "ok" | "error";

const Landing: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [healthDetail, setHealthDetail] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealthStatus("ok");
        setHealthDetail(data.status ?? "healthy");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setHealthStatus("error");
          setHealthDetail(String(err.message ?? err));
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="journey-typography min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 pt-8">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            title={healthDetail}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                healthStatus === "ok"
                  ? "bg-green-500"
                  : healthStatus === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-muted-foreground">
              {healthStatus === "ok"
                ? "API OK"
                : healthStatus === "error"
                ? "API unreachable"
                : "Checking API..."}
            </span>
          </div>
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

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button asChild className="h-12 px-6 justify-between">
                  <Link to="/journey/live">
                    <span>Follow the journey</span>
                    <span className="text-primary-foreground/70">→</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-6 justify-between">
                  <Link to="/journey/live">
                    <span>Preview follower view</span>
                    <span className="text-muted-foreground">→</span>
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


