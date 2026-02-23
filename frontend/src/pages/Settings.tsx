import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import SettingsSidebar, {
  type SettingsTab,
} from "@/components/settings/SettingsSidebar";
import VehicleSettingsCard from "@/components/settings/VehicleSettingsCard";
import { mockVehicles, mockSettingsConfig } from "@/data/mockSettingsData";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Construction } from "lucide-react";

const PlaceholderTab = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
    <Construction className="h-8 w-8" />
    <p className="text-base font-medium">{name} Settings</p>
    <p className="text-sm">Coming soon</p>
  </div>
);

const VehiclesTab = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Your Vehicles</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Manage vehicles connected to your journey
      </p>
    </div>

    <div className="space-y-4">
      {mockVehicles.map((vehicle) => (
        <VehicleSettingsCard
          key={vehicle.id}
          name={vehicle.name}
          model={vehicle.model}
          year={vehicle.year}
          vin={vehicle.vin}
          connectionProvider={vehicle.connectionProvider}
          isConnected={vehicle.isConnected}
        />
      ))}
    </div>

    <Button variant="outline" className="gap-2 w-full sm:w-auto">
      <Plus className="h-4 w-4" />
      Add Another Vehicle
    </Button>

    <p className="text-xs text-muted-foreground">
      {mockSettingsConfig.usedSlots} of {mockSettingsConfig.maxVehicleSlots}{" "}
      vehicle slots used
    </p>
  </div>
);

const Settings = () => {
  useDocumentTitle("Settings");
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<SettingsTab>("vehicles");

  const renderTabContent = () => {
    switch (activeTab) {
      case "vehicles":
        return <VehiclesTab />;
      case "account":
        return <PlaceholderTab name="Account" />;
      case "security":
        return <PlaceholderTab name="Security" />;
      case "privacy":
        return <PlaceholderTab name="Privacy" />;
      case "notifications":
        return <PlaceholderTab name="Notifications" />;
      case "integrations":
        return <PlaceholderTab name="Integrations" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 -ml-2 text-muted-foreground"
            >
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {isMobile ? (
          <div>
            <SettingsSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orientation="horizontal"
            />
            {renderTabContent()}
          </div>
        ) : (
          <div className="flex gap-8">
            <SettingsSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orientation="vertical"
            />
            <div className="flex-1 min-w-0">{renderTabContent()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
