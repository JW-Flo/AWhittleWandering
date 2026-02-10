import React from "react";
import JourneyArc from "./JourneyArc";
import Moment from "@/components/shared/Moment";

export type NarrativeUnifiedData = {
  overview?: {
    daysElapsed?: number;
    totalMiles?: number;
    statesVisited?: number;
    totalStates?: number;
  };
  currentStatus?: {
    location?: { state?: string; lastUpdate?: string };
  };
  timeline?: {
    drives?: Array<{
      id: number;
      date: string;
      startLocation?: string;
      endLocation: string;
      distance: number;
      startState?: string;
      endState?: string;
      durationMinutes?: number;
    }>;
  };
};

const safeDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
};

const formatDuration = (minutes?: number) => {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) return undefined;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const JourneyNarrative: React.FC<{ data: NarrativeUnifiedData | null }> = ({ data }) => {
  const locationLabel = data?.currentStatus?.location?.state;
  const lastUpdate = safeDate(data?.currentStatus?.location?.lastUpdate)?.toLocaleString();
  const drives = data?.timeline?.drives || [];

  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Now</h2>
        <p className="mt-2 text-lg leading-relaxed max-w-2xl">
          {locationLabel
            // Intentionally non-precise language.
            ? `Moving through ${locationLabel}. The details don't need to be loud to be meaningful—this is a chapter in motion.`
            : `The journey is in motion. When the next meaningful segment arrives, it will appear here as a chapter.`}
        </p>
        {lastUpdate && <p className="mt-2 text-xs text-muted-foreground">Last update: {lastUpdate}</p>}
      </div>

      <JourneyArc
        daysElapsed={data?.overview?.daysElapsed}
        totalMiles={data?.overview?.totalMiles}
        statesVisited={data?.overview?.statesVisited}
        totalStates={data?.overview?.totalStates}
      />

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Moments</h2>
        <div className="mt-4 space-y-4">
          {drives.slice(0, 12).map((d) => {
            const miles = Number.isFinite(d.distance) ? Math.round(d.distance) : null;
            const duration = formatDuration(d.durationMinutes);
            const from = d.startLocation;
            const to = d.endLocation;

            // Build a richer body with from/to, distance, and duration
            const parts: string[] = [];
            if (from && to) {
              parts.push(`${from} to ${to}`);
            } else if (to) {
              parts.push(`Arriving in ${to}`);
            }
            if (miles) parts.push(`${miles} miles`);
            if (duration) parts.push(duration);
            const body = parts.length > 0
              ? parts.join(" — ") + "."
              : "A chapter in the journey.";

            // Location label from state info (e.g. "TX → NM")
            const stateLabel = d.startState && d.endState && d.startState !== d.endState
              ? `${d.startState} → ${d.endState}`
              : d.endState || d.startState || undefined;

            return (
              <Moment
                key={d.id}
                kind={d.startState !== d.endState && d.startState && d.endState ? "milestone" : "segment"}
                title={to || "On the road"}
                timestamp={d.date}
                body={body}
                locationLabel={stateLabel}
              />
            );
          })}

          {drives.length === 0 && (
            <Moment
              kind="note"
              title="Moments will appear here"
              body="As the traveler adds highlights—photos, notes, and milestones—this story will fill in with calm, intentional beats."
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default JourneyNarrative;
