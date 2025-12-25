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
  timeline?: { drives?: Array<{ id: number; date: string; endLocation: string; distance: number }> };
};

const safeDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
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
            ? `Moving through ${locationLabel}. The details don’t need to be loud to be meaningful—this is a chapter in motion.`
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
          {drives.slice(0, 6).map((d) => (
            <Moment
              key={d.id}
              kind="segment"
              title={d.endLocation}
              timestamp={d.date}
              body={`A meaningful segment: ${Number.isFinite(d.distance) ? Math.round(d.distance) : "—"} miles.`}
            />
          ))}

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


