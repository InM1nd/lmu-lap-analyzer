export interface LapData {
  lap_number: number;
  lap_time_ms: number;
  sector1_ms: number;
  sector2_ms: number;
  sector3_ms: number;
  telemetry: TelemetryPoint[];
}

export interface TelemetryPoint {
  position_normalized: number; // 0-1 along the track
  speed: number;
  throttle: number; // 0-1
  brake: number; // 0-1
  gear: number;
  // Included for track mapping debugging if needed, though strictly requested are the above
  position_x?: number;
  position_y?: number;
}
