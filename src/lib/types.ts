export type Stage = 'immature' | 'ripening' | 'mature';

export interface AppControls {
  avgWeightG: number;
  postHarvestLossPct: number;
  numPlants: number;
  forecastDays: number;
  gddBaseC: number;
  harvestCapacityKgDay: number;
  useYolo: boolean;
  useLiveWeather: boolean;
  includePriceForecast: boolean;
  district: string;
}

export interface DetectionBox {
  box: [number, number, number, number]; // [x1, y1, x2, y2] percentages
  stage: Stage;
}

export interface DetectionResult {
  plantId: number;
  detections: number;
  boxes: DetectionBox[];
  stageCounts: Record<Stage, number>;
  growthStage: 'Immature' | 'Ripening' | 'Mature';
  avgBboxArea: number;
  confidence: number;
  imageUrl: string;
}

export interface DailyForecast {
  date: string;
  ready_kg: number;
  gdd_cum: number;
}

export interface HarvestTask {
  date: string;
  harvest_kg: number;
}

export interface ForecastResult {
  yield_now_kg: number;
  sellable_kg: number;
  daily: DailyForecast[];
  harvest_plan: HarvestTask[];
  notes: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: React.ReactNode;
}
