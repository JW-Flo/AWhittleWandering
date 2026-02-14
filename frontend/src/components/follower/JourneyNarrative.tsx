import React from "react";
import JourneyArc from "./JourneyArc";
import Moment from "@/components/shared/Moment";
import EmptyState from "@/components/common/EmptyState";
import { Camera } from "lucide-react";

export type NarrativeUnifiedData = {
  overview?: {
    daysElapsed?: number;
    totalMiles?: number;
    statesVisited?: number;
    totalStates?: number;
  };
  currentStatus?: {
    location?: { state?: string; lastUpdate?: string; city?: string };
  };
  timeline?: {
    drives?: Array<{
      id: number;
      date: string;
      startTime?: string | null;
      endTime?: string | null;
      startLocation?: string;
      endLocation: string;
      distance: number;
      duration?: number;
      durationMinutes?: number;
      startState?: string | null;
      endState?: string | null;
      startBattery?: number | null;
      endBattery?: number | null;
      energyUsed?: number;
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
  const state = data?.currentStatus?.location?.state;
  const city = data?.currentStatus?.location?.city;
  const locationLabel = city && city !== "Unknown" && state && state !== "Unknown"
    ? `${city}, ${state}`
    : (state && state !== "Unknown" ? state : null);
  const lastUpdate = safeDate(data?.currentStatus?.location?.lastUpdate)?.toLocaleString();
  const drives = data?.timeline?.drives || [];

  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Now</h2>
        <p className="mt-2 text-lg leading-relaxed max-w-2xl">
          {locationLabel
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
          {drives.slice(0, 20).map((d) => {
            const miles = Number.isFinite(d.distance) ? Math.round(d.distance) : null;
            const dur = d.durationMinutes ?? d.duration;
            const duration = formatDuration(dur);
            const from = d.startLocation && d.startLocation !== "Unknown" ? d.startLocation : null;
            const to = d.endLocation && d.endLocation !== "Unknown" ? d.endLocation : null;

            const isCrossing = !!(d.startState && d.endState && d.startState !== d.endState);

            // Build a richer body with from/to, distance, and duration
            const parts: string[] = [];
            if (from && to && from !== to) {
              parts.push(`${from} → ${to}`);
            } else if (to) {
              parts.push(to);
            } else if (from) {
              parts.push(from);
            }
            if (miles && miles > 0) parts.push(`${miles} mi`);
            if (duration) parts.push(duration);
            if (typeof d.energyUsed === "number" && d.energyUsed > 0) {
              parts.push(`${d.energyUsed.toFixed(1)} kWh`);
            }
            const body = parts.length > 0
              ? parts.join(" — ")
              : "A chapter in the journey.";

            // Location label from state info (e.g. "NC → SC")
            const stateLabel = isCrossing
              ? `${d.startState} → ${d.endState}`
              : d.endState || d.startState || undefined;

            return (
              <Moment
                key={d.id}
                kind={isCrossing ? "milestone" : "segment"}
                title={isCrossing ? `Crossed into ${d.endState}` : (to || from || "On the road")}
                timestamp={d.startTime || d.date}
                body={body}
                locationLabel={stateLabel}
              />
            );
          })}

          {drives.length === 0 && (
            <EmptyState
              icon={<Camera className="h-8 w-8" />}
              title="Moments will appear here as the traveler adds highlights along the way."
              description="As the traveler adds highlights—photos, notes, and milestones—this story will fill in with calm, intentional beats."
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default JourneyNarrative;
