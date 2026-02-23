import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap, Clock, Route, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

interface DriveData {
  id: number;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  distance: number;
  duration?: number;
  durationMinutes?: number;
  startLocation: string;
  endLocation: string;
  startCoordinates?: { lat: number; lng: number } | null;
  endCoordinates?: { lat: number; lng: number } | null;
  startState?: string | null;
  endState?: string | null;
  energyUsed?: number;
  startBattery?: number | null;
  endBattery?: number | null;
}

interface ChargeData {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  energyAdded: number;
  duration?: number;
  chargerType?: string | null;
  startBattery?: number | null;
  endBattery?: number | null;
  cost?: number | null;
}

interface TripTimelineProps {
  drives: DriveData[];
  charges: ChargeData[];
  onDriveSelect?: (drive: DriveData) => void;
  selectedDriveId?: number | null;
}

type TimelineItem = {
  type: 'drive';
  data: DriveData;
  sortTime: number;
} | {
  type: 'charge';
  data: ChargeData;
  sortTime: number;
};

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function locationShort(addr: string): string {
  if (!addr || addr === 'Unknown') return 'Unknown';
  // Take the city/area part (before any comma-separated state/zip)
  const parts = addr.split(',').map(s => s.trim());
  return parts[0] || addr;
}

const TripTimeline = ({ drives, charges, onDriveSelect, selectedDriveId }: TripTimelineProps) => {
  // Merge drives and charges into a single sorted timeline, grouped by day
  const grouped = useMemo(() => {
    const items: TimelineItem[] = [];

    for (const d of drives) {
      const ts = d.startTime || d.date;
      items.push({ type: 'drive', data: d, sortTime: new Date(ts || 0).getTime() });
    }
    for (const c of charges) {
      const ts = c.startTime || c.date;
      items.push({ type: 'charge', data: c, sortTime: new Date(ts || 0).getTime() });
    }

    // Sort descending (most recent first)
    items.sort((a, b) => b.sortTime - a.sortTime);

    // Group by date
    const groups: { date: string; items: TimelineItem[] }[] = [];
    let currentDate = '';
    for (const item of items) {
      const dateKey = item.type === 'drive' ? item.data.date : item.data.date;
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: dateKey, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }

    return groups;
  }, [drives, charges]);

  if (drives.length === 0 && charges.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6">
          <EmptyState
            icon={<Route className="w-8 h-8" />}
            title="No drives recorded yet"
            description="Historical data will appear once imported."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
      {grouped.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {formatDateHeader(group.date)}
            </p>
          </div>

          <div className="space-y-2">
            {group.items.map((item) => {
              if (item.type === 'drive') {
                const drive = item.data;
                const isSelected = selectedDriveId === drive.id;
                const crossedStates = drive.startState && drive.endState && drive.startState !== drive.endState;
                const dur = drive.durationMinutes ?? drive.duration ?? 0;

                return (
                  <Card
                    key={`drive-${drive.id}`}
                    className={`border-border/40 cursor-pointer transition-colors hover:border-primary/40 ${
                      isSelected ? 'border-primary/60 bg-primary/5' : ''
                    }`}
                    onClick={() => onDriveSelect?.(drive)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Route className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="truncate font-medium">{locationShort(drive.startLocation)}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate font-medium">{locationShort(drive.endLocation)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {drive.distance > 0 && (
                              <span>{Math.round(drive.distance)} mi</span>
                            )}
                            {dur > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(dur)}
                              </span>
                            )}
                            {formatTime(drive.startTime) && (
                              <span>{formatTime(drive.startTime)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            {crossedStates && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                {drive.startState} → {drive.endState}
                              </Badge>
                            )}
                            {drive.startBattery != null && drive.endBattery != null && (
                              <span className="text-[10px] text-muted-foreground">
                                {Math.round(drive.startBattery)}% → {Math.round(drive.endBattery)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Charge card
              const charge = item.data;
              const dur = charge.duration ?? 0;
              return (
                <Card key={`charge-${charge.id}`} className="border-border/30">
                  <CardContent className="p-2.5 pl-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">
                            {charge.chargerType || 'Charge'} — {locationShort(charge.location)}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            +{charge.energyAdded.toFixed(1)} kWh
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                          {dur > 0 && <span>{formatDuration(dur)}</span>}
                          {charge.startBattery != null && charge.endBattery != null && (
                            <span>{Math.round(charge.startBattery)}% → {Math.round(charge.endBattery)}%</span>
                          )}
                          {charge.cost != null && charge.cost > 0 && (
                            <span>${charge.cost.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TripTimeline;
