import { Badge } from "@/components/ui/badge";
import { Eye, Users, Unlock } from "lucide-react";

interface ExploreHeaderProps {
  title: string;
  subtitle: string;
  featuresUnlocked: boolean;
  views: number;
  visitors: number;
}

const ExploreHeader = ({
  title,
  subtitle,
  featuresUnlocked,
  views,
  visitors,
}: ExploreHeaderProps) => {
  return (
    <div className="px-6 py-4 bg-card/60 backdrop-blur-sm border-b border-border/40">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {featuresUnlocked && (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-primary/15 text-primary border-primary/30"
            >
              <Unlock className="h-3 w-3" />
              Features Unlocked
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5">
            <Eye className="h-3 w-3" />
            {views} views
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Users className="h-3 w-3" />
            {visitors} visitors
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ExploreHeader;
