
import { z } from 'zod';

export type Stage = 'immature' | 'ripening' | 'mature' | 'flower' | 'breaker' | 'pink';

export const AppControlsSchema = z.object({
  avgWeightG: z.number(),
  postHarvestLossPct: z.number(),
  numPlants: z.number(),
  forecastDays: z.number(),
  gddBaseC: z.number(),
  harvestCapacityKgDay: z.number(),
  useDetectionModel: z.boolean(),
  useLiveWeather: z.boolean(),
  includePriceForecast: z.boolean(),
  district: z.string(),
});
export type AppControls = z.infer<typeof AppControlsSchema>;


export interface DetectionBox {
  box: [number, number, number, number]; // [x1, y1, x2, y2] percentages
  stage: Stage;
}

export const StageCountsSchema = z.object({
    flower: z.number().describe("Count of visible flowers."),
    immature: z.number().describe("Count of immature (green) tomatoes."),
    breaker: z.number().describe("Count of breaker stage tomatoes (first sign of color)."),
    ripening: z.number().describe("Count of ripening (yellow/orange) tomatoes."),
    pink: z.number().describe("Count of pink tomatoes (mostly colored but not fully red)."),
    mature: z.number().describe("Count of mature (red) tomatoes."),
});
export type StageCounts = z.infer<typeof StageCountsSchema>;

export interface DetectionResult {
  plantId: number;
  detections: number;
  boxes: DetectionBox[];
  stageCounts: StageCounts;
  growthStage: 'Immature' | 'Ripening' | 'Mature';
  avgBboxArea: number;
  confidence: number;
  imageUrl: string;
  summary?: string;
}

export const DailyForecastSchema = z.object({
  date: z.string(),
  ready_kg: z.number(),
  gdd_cum: z.number(),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

export const HarvestTaskSchema = z.object({
  date: z.string(),
  harvest_kg: z.number(),
});
export type HarvestTask = z.infer<typeof HarvestTaskSchema>;

export const HarvestWindowSchema = z.object({
    start: z.string().describe("The start date of the optimal harvest window."),
    end: z.string().describe("The end date of the optimal harvest window."),
});
export type HarvestWindow = z.infer<typeof HarvestWindowSchema>;

export const ForecastResultSchema = z.object({
    yield_now_kg: z.number(),
    sellable_kg: z.number(),
    daily: z.array(DailyForecastSchema),
    harvest_plan: z.array(HarvestTaskSchema),
    harvestWindow: HarvestWindowSchema.optional(),
    notes: z.array(z.string()),
});
export type ForecastResult = z.infer<typeof ForecastResultSchema>;


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: React.ReactNode;
}


// == AI Flow Schemas ==

export const AnalyzeTomatoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  contentType: z.string().describe('The MIME type of the image, e.g., "image/jpeg".'),
});
export type AnalyzeTomatoInput = z.infer<typeof AnalyzeTomatoInputSchema>;

export const TomatoAnalysisResultSchema = z.object({
  summary: z.string().describe("A short summary of the detection results."),
  counts: StageCountsSchema.describe("The counts of tomatoes and flowers classified by growth stage."),
});
export type TomatoAnalysisResult = z.infer<typeof TomatoAnalysisResultSchema>;

export const WeatherDataSchema = z.object({
    date: z.string().describe('The date for the forecast in YYYY-MM-DD format.'),
    temp_max_c: z.number().describe('The maximum forecasted temperature in Celsius.'),
    temp_min_c: z.number().describe('The minimum forecasted temperature in Celsius.'),
});
export type WeatherData = z.infer<typeof WeatherDataSchema>;

export const YieldForecastingInputSchema = z.object({
  detectionResult: TomatoAnalysisResultSchema,
  weatherData: z.array(WeatherDataSchema),
  controls: AppControlsSchema,
});
export type YieldForecastingInput = z.infer<typeof YieldForecastingInputSchema>;
