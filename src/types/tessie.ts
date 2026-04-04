export interface RawTessieData {
  timestamp: string;
  deviceId: string;
  metrics: {
    [key: string]: number | string;
  };
}

export interface CanonicalMetric {
  deviceId: string;
  timestamp: Date;
  metricName: string;
  metricValue: number;
  unit?: string;
}