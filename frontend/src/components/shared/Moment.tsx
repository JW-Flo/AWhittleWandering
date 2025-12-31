import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type MomentKind = "segment" | "milestone" | "note" | "photo";

export type MomentMedia = {
  url: string;
  type: "image" | "video";
  alt?: string;
};

export type MomentProps = {
  kind: MomentKind;
  title: string;
  body?: string;
  timestamp?: string;
  locationLabel?: string;
  media?: MomentMedia[];
};

const formatWhen = (ts?: string) => {
  if (!ts) return undefined;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const kindLabel: Record<MomentKind, string> = {
  segment: "Segment",
  milestone: "Milestone",
  note: "Note",
  photo: "Photo",
};

const Moment: React.FC<MomentProps> = ({ kind, title, body, timestamp, locationLabel, media }) => {
  const when = formatWhen(timestamp);

  return (
    <Card className="story-card">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{kindLabel[kind]}</Badge>
          {when && <span>{when}</span>}
          {locationLabel && <span>• {locationLabel}</span>}
        </div>

        <p className="mt-3 text-base font-medium">{title}</p>
        {body && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>}

        {media && media.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {media.slice(0, 4).map((m) => (
              <div key={m.url} className="overflow-hidden rounded-lg border border-border/60 bg-card/30">
                {m.type === "image" ? (
                  // External input is untrusted; we only render as an <img> with safe attrs.
                  <img
                    src={m.url}
                    alt={m.alt || "Moment media"}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video src={m.url} className="h-32 w-full object-cover" controls />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Moment;










