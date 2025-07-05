"use client";

/* eslint-disable no-undef */
import * as React from "react";
import { Zap, MapPin, Battery, Navigation } from "lucide-react";

// Utility function to merge class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Simple card component implementation
const Card = ({ className, children, ...props }) => (
  <div 
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  >
    {children}
  </div>
);

// Simple card content implementation
const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);

// Simple button implementation
const Button = ({ variant = "default", className, children, ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
      variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
      variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      "h-9 px-4 py-2",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

// ChargingStationCard component
export function ChargingStationCard({
  name,
  distance,
  availableChargers,
  totalChargers,
  isSupercharger,
  className,
  onNavigate,
}) {
  const availabilityPercentage = (availableChargers / totalChargers) * 100;
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-border/50 bg-card hover:shadow-md transition-shadow duration-300",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-base text-foreground">{name}</h3>
              {isSupercharger && (
                <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                  <Zap className="h-3 w-3 text-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Supercharger</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-muted-foreground text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{distance} away</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <Battery className={cn(
              "h-4 w-4 mb-1",
              availabilityPercentage > 60 ? "text-green-500" : 
              availabilityPercentage > 30 ? "text-amber-500" : "text-red-500"
            )} />
            <div className="text-xs font-medium">
              <span className={cn(
                availabilityPercentage > 60 ? "text-green-600 dark:text-green-400" : 
                availabilityPercentage > 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
              )}>
                {availableChargers}
              </span>
              <span className="text-muted-foreground">/{totalChargers} available</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full",
              availabilityPercentage > 60 ? "bg-green-500" : 
              availabilityPercentage > 30 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${availabilityPercentage}%` }}
          />
        </div>
        
        {/* Navigate button from variant 1 */}
        <Button 
          variant="outline" 
          className="w-full mt-3 text-xs" 
          onClick={onNavigate}
        >
          <Navigation className="h-3 w-3 mr-1" />
          Navigate
        </Button>
      </CardContent>
      
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent pointer-events-none"
        style={{ 
          backgroundSize: "20px 20px",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          opacity: 0.2
        }}
      />
    </Card>
  );
}

// Example usage
export default function ChargingStationExample() {
  const chargingStations = [
    {
      name: "Tesla Supercharger - Mountain View",
      distance: "5 miles",
      availableChargers: 8,
      totalChargers: 12,
      isSupercharger: true,
    },
    {
      name: "Palo Alto Charging Station",
      distance: "12 miles",
      availableChargers: 2,
      totalChargers: 6,
      isSupercharger: false,
    },
    {
      name: "San Jose Tesla Center",
      distance: "18 miles",
      availableChargers: 0,
      totalChargers: 4,
      isSupercharger: true,
    }
  ];

  // Use React state to track navigation status
  const [navigatingTo, setNavigatingTo] = React.useState(null);
  
  const handleNavigate = (stationName) => {
    // This function would integrate with a mapping service in a real implementation
    // In this example, we'll just update React state to show what we're navigating to
    setNavigatingTo(stationName);
  };
  
  // Use React's useEffect to handle the timeout
  React.useEffect(() => {
    let timerId;
    
    if (navigatingTo) {
      // Reset after a short delay to simulate navigation completion
      timerId = setTimeout(() => {
        setNavigatingTo(null);
      }, 2000);
    }
    
    // Cleanup function to clear the timer if component unmounts
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [navigatingTo]); // Only re-run effect if navigatingTo changes

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-4 bg-background">
      <h2 className="text-xl font-semibold text-foreground mb-4">Nearby Charging Stations</h2>
      {navigatingTo && (
        <div className="p-2 mb-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 text-xs">
          <Navigation className="inline-block h-3 w-3 mr-1" />
          Navigating to {navigatingTo}...
        </div>
      )}
      {chargingStations.map((station, index) => (
        <ChargingStationCard
          key={index}
          name={station.name}
          distance={station.distance}
          availableChargers={station.availableChargers}
          totalChargers={station.totalChargers}
          isSupercharger={station.isSupercharger}
          onNavigate={() => handleNavigate(station.name)}
        />
      ))}
    </div>
  );
}
