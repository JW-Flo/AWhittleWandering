import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type JourneyArcProps = {
  daysElapsed?: number;
  totalMiles?: number;
  statesVisited?: number;
  totalStates?: number;
};

const safePercent = (num?: number, den?: number) => {
  if (typeof num !== "number" || typeof den !== "number") return 0;
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return Math.max(0, Math.min(100, (num / den) * 100));
};

const JourneyArc: React.FC<JourneyArcProps> = ({ daysElapsed, totalMiles, statesVisited, totalStates }) => {
  const pct = useMemo(() => safePercent(statesVisited, totalStates), [statesVisited, totalStates]);

  return (
    <Card className="story-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">The arc so far</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Days</p>
            <p className="mt-1 text-xl font-semibold">{typeof daysElapsed === "number" ? daysElapsed : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Miles</p>
            <p className="mt-1 text-xl font-semibold">
              {typeof totalMiles === "number" ? totalMiles.toLocaleString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">States</p>
            <p className="mt-1 text-xl font-semibold">
              {typeof statesVisited === "number" && typeof totalStates === "number"
                ? `${statesVisited} / ${totalStates}`
                : "—"}
            </p>
          </div>
        </div>

        <div>
          <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/60"
              style={{ width: `${pct}%`, transition: "width 600ms ease" }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 text-[11px] text-muted-foreground">
            <span>Beginning</span>
            <span className="text-center">Middle</span>
            <span className="text-center">Late</span>
            <span className="text-right">Arrival</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyArc;









