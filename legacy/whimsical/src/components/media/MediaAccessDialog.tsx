import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ImageOff, Images, Shield } from "lucide-react";

interface MediaAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccessSelected: (level: "full" | "limited" | "none") => void;
}

export function MediaAccessDialog({
  open,
  onOpenChange,
  onAccessSelected,
}: MediaAccessDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<"full" | "limited" | "none" | null>(null);

  const handleConfirm = () => {
    if (selectedLevel) {
      onAccessSelected(selectedLevel);
      onOpenChange(false);
    }
  };

  const accessOptions = [
    {
      level: "full" as const,
      icon: Images,
      title: "Full Access",
      description: "Access all photos and videos in your library. Best for automatic GPS-based matching to waypoints.",
    },
    {
      level: "limited" as const,
      icon: Camera,
      title: "Limited Access",
      description: "Select specific photos each time you want to upload. You control exactly what's shared.",
    },
    {
      level: "none" as const,
      icon: ImageOff,
      title: "No Access",
      description: "Don't access media library. You can still upload photos manually later.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Media Library Access</DialogTitle>
          </div>
          <DialogDescription>
            AWW can sync photos from your journey with GPS coordinates and timestamps to automatically tag them to waypoints.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {accessOptions.map((option) => (
            <button
              key={option.level}
              onClick={() => setSelectedLevel(option.level)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedLevel === option.level
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <option.icon className={`w-5 h-5 mt-0.5 ${
                  selectedLevel === option.level ? "text-primary" : "text-muted-foreground"
                }`} />
                <div>
                  <p className={`font-medium ${
                    selectedLevel === option.level ? "text-primary" : "text-foreground"
                  }`}>
                    {option.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selectedLevel}
          >
            Continue
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can change this later in Settings → Privacy
        </p>
      </DialogContent>
    </Dialog>
  );
}
