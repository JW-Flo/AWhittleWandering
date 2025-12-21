import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Check, Target, TrendingUp } from 'lucide-react';
import { journeyWaypoints } from '@/data/journeyRoute';

interface StateProgress {
  code: string;
  name: string;
  visited: boolean;
  date?: string;
  order?: number;
}

const ALL_STATES: StateProgress[] = [
  { code: 'AL', name: 'Alabama', visited: true, date: 'Aug 13', order: 44 },
  { code: 'AK', name: 'Alaska', visited: false },
  { code: 'AZ', name: 'Arizona', visited: true, date: 'Jun 9', order: 4 },
  { code: 'AR', name: 'Arkansas', visited: true, date: 'Aug 16', order: 47 },
  { code: 'CA', name: 'California', visited: true, date: 'Jun 11', order: 5 },
  { code: 'CO', name: 'Colorado', visited: true, date: 'Jul 1', order: 18 },
  { code: 'CT', name: 'Connecticut', visited: true, date: 'Jul 24', order: 32 },
  { code: 'DE', name: 'Delaware', visited: true, date: 'Jul 28', order: 36 },
  { code: 'FL', name: 'Florida', visited: true, date: 'Aug 17', order: 48 },
  { code: 'GA', name: 'Georgia', visited: true, date: 'Aug 11', order: 42 },
  { code: 'HI', name: 'Hawaii', visited: false },
  { code: 'ID', name: 'Idaho', visited: true, date: 'Jun 25', order: 11 },
  { code: 'IL', name: 'Illinois', visited: true, date: 'Jul 11', order: 24 },
  { code: 'IN', name: 'Indiana', visited: true, date: 'Jul 12', order: 25 },
  { code: 'IA', name: 'Iowa', visited: true, date: 'Jul 8', order: 21 },
  { code: 'KS', name: 'Kansas', visited: true, date: 'Aug 17', order: 46 },
  { code: 'KY', name: 'Kentucky', visited: true, date: 'Jul 14', order: 27 },
  { code: 'LA', name: 'Louisiana', visited: true, date: 'Aug 15', order: 45 },
  { code: 'ME', name: 'Maine', visited: true, date: 'Jul 27', order: 35 },
  { code: 'MD', name: 'Maryland', visited: true, date: 'Jul 28', order: 37 },
  { code: 'MA', name: 'Massachusetts', visited: true, date: 'Jul 23', order: 31 },
  { code: 'MI', name: 'Michigan', visited: true, date: 'Jul 13', order: 26 },
  { code: 'MN', name: 'Minnesota', visited: true, date: 'Jul 9', order: 22 },
  { code: 'MS', name: 'Mississippi', visited: true, date: 'Aug 14', order: 43 },
  { code: 'MO', name: 'Missouri', visited: true, date: 'Jul 8', order: 20 },
  { code: 'MT', name: 'Montana', visited: true, date: 'Jun 27', order: 13 },
  { code: 'NE', name: 'Nebraska', visited: true, date: 'Jul 3', order: 19 },
  { code: 'NV', name: 'Nevada', visited: true, date: 'Jun 11', order: 6 },
  { code: 'NH', name: 'New Hampshire', visited: true, date: 'Jul 26', order: 34 },
  { code: 'NJ', name: 'New Jersey', visited: true, date: 'Jul 22', order: 29 },
  { code: 'NM', name: 'New Mexico', visited: true, date: 'Jun 7', order: 3 },
  { code: 'NY', name: 'New York', visited: true, date: 'Jul 22', order: 30 },
  { code: 'NC', name: 'North Carolina', visited: true, date: 'Jul 29', order: 39 },
  { code: 'ND', name: 'North Dakota', visited: true, date: 'Jul 8', order: 16 },
  { code: 'OH', name: 'Ohio', visited: true, date: 'Jul 15', order: 28 },
  { code: 'OK', name: 'Oklahoma', visited: true, date: 'Aug 18', order: 48 },
  { code: 'OR', name: 'Oregon', visited: true, date: 'Jun 19', order: 8 },
  { code: 'PA', name: 'Pennsylvania', visited: true, date: 'Jul 18', order: 28 },
  { code: 'RI', name: 'Rhode Island', visited: true, date: 'Jul 24', order: 33 },
  { code: 'SC', name: 'South Carolina', visited: true, date: 'Aug 3', order: 40 },
  { code: 'SD', name: 'South Dakota', visited: true, date: 'Jul 7', order: 15 },
  { code: 'TN', name: 'Tennessee', visited: true, date: 'Aug 8', order: 41 },
  { code: 'TX', name: 'Texas', visited: true, date: 'Jun 3', order: 1 },
  { code: 'UT', name: 'Utah', visited: true, date: 'Jun 30', order: 17 },
  { code: 'VT', name: 'Vermont', visited: true, date: 'Jul 26', order: 33 },
  { code: 'VA', name: 'Virginia', visited: true, date: 'Jul 29', order: 38 },
  { code: 'WA', name: 'Washington', visited: true, date: 'Jun 22', order: 10 },
  { code: 'WV', name: 'West Virginia', visited: true, date: 'Jul 19', order: 28 },
  { code: 'WI', name: 'Wisconsin', visited: true, date: 'Jul 10', order: 23 },
  { code: 'WY', name: 'Wyoming', visited: true, date: 'Jun 29', order: 14 },
];

interface StatesProgressMapProps {
  animate?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function StatesProgressMap({ 
  animate = true, 
  showDetails = true,
  className = '' 
}: StatesProgressMapProps) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const visitedStates = ALL_STATES.filter(s => s.visited).sort((a, b) => (a.order || 0) - (b.order || 0));
  const totalVisited = visitedStates.length;

  // Intersection observer for scroll animation
  useEffect(() => {
    if (!animate) {
      setDisplayedCount(totalVisited);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animate, isInView, totalVisited]);

  // Animate counter when in view
  useEffect(() => {
    if (!isInView || !animate) return;

    let current = 0;
    const increment = () => {
      if (current < totalVisited) {
        current++;
        setDisplayedCount(current);
        setTimeout(increment, 50);
      }
    };
    increment();
  }, [isInView, animate, totalVisited]);

  return (
    <Card ref={containerRef} className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span>States Conquered</span>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <span className="font-display font-bold text-primary">{displayedCount}</span>
            <span className="text-muted-foreground"> / 48</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-primary">
              {Math.round((displayedCount / 48) * 100)}%
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-sunset to-forest transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${(displayedCount / 48) * 100}%` }}
            />
          </div>
        </div>

        {/* State Grid */}
        {showDetails && (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {ALL_STATES.map((state, index) => {
              const isAnimatedIn = animate ? (state.order || 99) <= displayedCount : state.visited;
              const shouldShow = !animate || isAnimatedIn;
              
              return (
                <div
                  key={state.code}
                  className={`
                    relative group flex items-center justify-center
                    w-full aspect-square rounded-lg text-xs font-bold
                    transition-all duration-300 cursor-default
                    ${state.visited 
                      ? shouldShow 
                        ? 'bg-primary text-primary-foreground shadow-sm scale-100' 
                        : 'bg-muted text-muted-foreground scale-95 opacity-50'
                      : 'bg-muted/50 text-muted-foreground/50'
                    }
                  `}
                  style={{
                    transitionDelay: animate ? `${(state.order || 0) * 30}ms` : '0ms'
                  }}
                >
                  {state.code}
                  
                  {state.visited && shouldShow && (
                    <Check className="absolute -top-1 -right-1 w-3 h-3 text-green-500 bg-background rounded-full" />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                                  bg-popover text-popover-foreground text-xs rounded shadow-lg
                                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                  whitespace-nowrap z-10">
                    <div className="font-medium">{state.name}</div>
                    {state.date && (
                      <div className="text-muted-foreground">{state.date}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent States */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Journey Order
          </h4>
          <div className="flex flex-wrap gap-1">
            {visitedStates.slice(0, 10).map((state) => (
              <Badge 
                key={state.code} 
                variant="outline" 
                className="text-xs"
              >
                {state.order}. {state.name}
              </Badge>
            ))}
            {visitedStates.length > 10 && (
              <Badge variant="secondary" className="text-xs">
                +{visitedStates.length - 10} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
