import { RawTessieData, CanonicalMetric } from '../types/tessie';

export class TessieTransformer {
  static transform(rawData: RawTessieData[]): CanonicalMetric[] {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    return rawData.flatMap(entry => 
      Object.entries(entry.metrics).map(([metricName, metricValue]) => ({
        deviceId: entry.deviceId,
        timestamp: new Date(entry.timestamp),
        metricName,
        metricValue: this.parseMetricValue(metricValue),
        unit: this.inferUnit(metricName)
      }))
    );
  }

  private static parseMetricValue(value: number | string): number {
    if (typeof value === 'number') return value;
    
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error('Invalid metric value: ${value}');
    }
    return parsed;
  }

  private static inferUnit(metricName: string): string | undefined {
    const unitMappings: { [key: string]: string } = {
      'temperature': '°C',
      'voltage': 'V',
      'current': 'A',
      'power': 'W'
    };

    return unitMappings[metricName.toLowerCase()];
  }
}