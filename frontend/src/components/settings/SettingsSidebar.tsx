import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Car, Shield, Eye, Bell, Plug } from "lucide-react";

export type SettingsTab =
  | "account"
  | "vehicles"
  | "security"
  | "privacy"
  | "notifications"
  | "integrations";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  orientation?: "vertical" | "horizontal";
}

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
  { id: "account", label: "Account", icon: User },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
];

const SettingsSidebar = ({
  activeTab,
  onTabChange,
  orientation = "vertical",
}: SettingsSidebarProps) => {
  const isVertical = orientation === "vertical";

  return (
    <nav
      className={cn(
        isVertical
          ? "flex flex-col gap-1 w-48 shrink-0"
          : "flex gap-1 overflow-x-auto pb-2 border-b border-border/40 mb-4",
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start gap-2",
              isVertical ? "w-full" : "shrink-0",
              isActive &&
                "bg-secondary text-foreground font-medium",
              !isActive && "text-muted-foreground",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </nav>
  );
};

export default SettingsSidebar;
