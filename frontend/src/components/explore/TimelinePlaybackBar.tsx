import { useCallback, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelinePlaybackBarProps {
  startDate: Date;
  endDate: Date;
  currentDay: number;
  totalDays: number;
  isPlaying: boolean;
  playbackSpeed: 0.5 | 1 | 2;
  onDayChange: (day: number) => void;
  onPlayPause: () => void;
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeedChange: (speed: 0.5 | 1 | 2) => void;
  formatDate: (day: number) => string;
}

const TimelinePlaybackBar = ({
  startDate,
  endDate,
  currentDay,
  totalDays,
  isPlaying,
  playbackSpeed,
  onDayChange,
  onPlayPause,
  onSkipToStart,
  onSkipToEnd,
  onPrevious,
  onNext,
  onSpeedChange,
  formatDate,
}: TimelinePlaybackBarProps) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onNext();
      }, 1000 / playbackSpeed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, onNext]);

  const formatLabel = useCallback(
    (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    [],
  );

  const speeds: Array<0.5 | 1 | 2> = [0.5, 1, 2];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border/40 px-6 py-4 space-y-3">
      {/* Date labels + slider */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[60px]">
          {formatLabel(startDate)}
        </span>
        <div className="flex-1 relative">
          <Slider
            value={[currentDay]}
            onValueChange={(val) => onDayChange(val[0])}
            min={0}
            max={totalDays}
            step={1}
          />
          <div className="mt-1 text-center">
            <span className="text-xs font-medium text-primary">
              {formatDate(currentDay)}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[60px] text-right">
          {formatLabel(endDate)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-2">
        {/* Speed controls (left) */}
        <div className="flex items-center gap-1 mr-4">
          {speeds.map((speed) => (
            <Button
              key={speed}
              variant={playbackSpeed === speed ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs font-medium",
                playbackSpeed === speed &&
                  "bg-primary text-primary-foreground",
              )}
              onClick={() => onSpeedChange(speed)}
            >
              {speed}x
            </Button>
          ))}
        </div>

        {/* Playback controls (center) */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipToStart}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSkipToEnd}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TimelinePlaybackBar;
