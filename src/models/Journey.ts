export interface Journey {
  id: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  distance: number;
  averageSpeed: number;
}