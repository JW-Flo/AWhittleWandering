import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ExploreHeader from "@/components/explore/ExploreHeader";
import TimelinePlaybackBar from "@/components/explore/TimelinePlaybackBar";
import { mockExploreData } from "@/data/mockExploreData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const LazyTeslaMap = lazy(() => import("@/components/LazyTeslaMap"));

const MapLoadingFallback = () => (
  <Card className="h-full flex items-center justify-center bg-card/50">
    <CardContent className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </CardContent>
  </Card>
);

const ExploreJourney = () => {
  useDocumentTitle("Explore Journey");

  const { timeline, stats } = mockExploreData;

  const startDate = useMemo(() => new Date(timeline.startDate), [timeline.startDate]);
  const endDate = useMemo(() => new Date(timeline.endDate), [timeline.endDate]);
  const totalDays = useMemo(() => {
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);

  const currentDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + currentDay);
    return d;
  }, [startDate, currentDay]);

  const formatDate = useCallback(
    (day: number) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + day);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
    [startDate],
  );

  // Build route locations for the map up to the current date
  const routeLocations = useMemo(() => {
    return timeline.waypoints
      .filter((wp) => new Date(wp.date) <= currentDate)
      .map((wp) => ({
        lat: wp.lat,
        lng: wp.lng,
        timestamp: wp.date,
      }));
  }, [timeline.waypoints, currentDate]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentDay((prev) => {
      if (prev >= totalDays) {
        setIsPlaying(false);
        return totalDays;
      }
      return prev + 1;
    });
  }, [totalDays]);

  const handlePrevious = useCallback(() => {
    setCurrentDay((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSkipToStart = useCallback(() => {
    setCurrentDay(0);
    setIsPlaying(false);
  }, []);

  const handleSkipToEnd = useCallback(() => {
    setCurrentDay(totalDays);
    setIsPlaying(false);
  }, [totalDays]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Back nav */}
      <div className="px-6 pt-3 pb-0">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header with title, subtitle, badges */}
      <ExploreHeader
        title={mockExploreData.title}
        subtitle={mockExploreData.subtitle}
        featuresUnlocked={stats.featuresUnlocked}
        views={stats.views}
        visitors={stats.visitors}
      />

      {/* Map + Timeline overlay */}
      <div className="flex-1 relative min-h-0">
        <Suspense fallback={<MapLoadingFallback />}>
          <LazyTeslaMap
            routeLocations={routeLocations}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          />
        </Suspense>

        {/* Gradient fade at bottom for timeline blending */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card/60 to-transparent pointer-events-none" />

        <TimelinePlaybackBar
          startDate={startDate}
          endDate={endDate}
          currentDay={currentDay}
          totalDays={totalDays}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onDayChange={setCurrentDay}
          onPlayPause={handlePlayPause}
          onSkipToStart={handleSkipToStart}
          onSkipToEnd={handleSkipToEnd}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSpeedChange={setPlaybackSpeed}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default ExploreJourney;
