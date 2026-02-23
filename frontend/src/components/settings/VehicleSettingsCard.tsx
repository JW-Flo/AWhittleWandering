import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Wifi, WifiOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";

type ConnectionTestStatus = "idle" | "testing" | "success" | "error";

interface VehicleSettingsCardProps {
  name: string;
  model: string;
  year: number;
  vin: string;
  connectionProvider: string;
  isConnected: boolean;
}

const VehicleSettingsCard = ({
  name,
  model,
  year,
  vin,
  connectionProvider,
  isConnected,
}: VehicleSettingsCardProps) => {
  const [testStatus, setTestStatus] = useState<ConnectionTestStatus>("idle");

  const maskedVin = vin.slice(0, 11) + "******";

  const [errorDetail, setErrorDetail] = useState<string>("");

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setErrorDetail("");
    try {
      const resp = await fetch(`${API_CONFIG.BASE_URL}/api/v1/vehicle/test-connection`);
      const data = await resp.json();
      if (data.ok) {
        setTestStatus("success");
      } else {
        setErrorDetail(data.error || `HTTP ${resp.status}`);
        setTestStatus("error");
      }
    } catch (err: any) {
      setErrorDetail(err?.message || "Network error");
      setTestStatus("error");
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {year} {model}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isConnected
                ? "text-primary border-primary/40 gap-1.5"
                : "text-muted-foreground gap-1.5"
            }
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isConnected
              ? `Connected via ${connectionProvider}`
              : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">VIN:</span>
          <code className="bg-secondary/50 px-2 py-0.5 rounded text-xs font-mono">
            {maskedVin}
          </code>
        </div>

        {/* API Connection Test */}
        <div className="border border-border/40 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Connection Test</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testStatus === "testing"}
            >
              {testStatus === "testing" && (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              )}
              Test Connection
            </Button>
          </div>

          {testStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Connection successful
            </div>
          )}
          {testStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>Connection Failed{errorDetail ? ` — ${errorDetail}` : ""}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleSettingsCard;
