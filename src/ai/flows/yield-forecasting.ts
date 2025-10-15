
'use server';
/**
 * @fileOverview An AI flow for forecasting the total yield of a plant based on its current state.
 *
 * - forecastYield - A function that handles the yield forecasting process.
 * - YieldForecastInput - The input type for the forecastYield function.
 * - YieldForecastOutput - The return type for the forecastYield function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AppControlsSchema, PlantAnalysisResultSchema } from '@/lib/types';


export const YieldForecastInputSchema = z.object({
  analysis: PlantAnalysisResultSchema.describe("The result from the plant analysis flow, including stage counts."),
  controls: AppControlsSchema.describe("The user-defined parameters for the farm."),
});
export type YieldForecastInput = z.infer<typeof YieldForecastInputSchema>;

export const YieldForecastOutputSchema = z.object({
  totalExpectedYieldKg: z.number().describe("The total estimated yield in kilograms for the entire lifecycle of the current fruit generation."),
  peakHarvestDate: z.string().describe("The estimated date (YYYY-MM-DD) when the harvest will be at its peak."),
  yieldCurve: z.array(z.object({
    date: z.string().describe("The date for the data point (YYYY-MM-DD)."),
    yieldKg: z.number().describe("The estimated cumulative harvestable yield in kilograms on that date."),
  })).describe("An array of data points representing the yield curve over time."),
  confidence: z.number().min(0).max(1).describe("A confidence score (0 to 1) for the forecast."),
  notes: z.string().describe("A brief summary and any important notes about the forecast."),
});
export type YieldForecastOutput = z.infer<typeof YieldForecastOutputSchema>;


export async function forecastYield(input: YieldForecastInput): Promise<YieldForecastOutput> {
  return forecastYieldFlow(input);
}


const forecastPrompt = ai.definePrompt({
  name: 'yieldForecastPrompt',
  input: { schema: YieldForecastInputSchema },
  output: { schema: YieldForecastOutputSchema, format: "json" },
  prompt: `
You are an expert agricultural AI specializing in yield forecasting for various plants.
Your task is to predict the total yield and yield curve based on an initial analysis of a plant.

**Input Data:**
1.  **Plant Analysis:**
    -   Plant Type: {{{analysis.plantType}}}
    -   Summary: {{{analysis.summary}}}
    -   Stage Counts: {{json analysis.stages}}

2.  **Farming Controls:**
    -   Number of Plants: {{{controls.numPlants}}}
    -   Average Fruit Weight (grams): {{{controls.avgWeightG}}}
    -   Forecast Horizon (days): {{{controls.forecastDays}}}

**Your Goal:**
Generate a JSON object that forecasts the total yield from the current generation of fruits and flowers.

**Instructions:**
1.  **Estimate Total Potential:** Calculate the total number of potential fruits by summing all counts (flowers, fruitlets, immature, etc.).
2.  **Calculate Total Expected Yield (Kg):** Multiply the total potential fruit count by the average fruit weight and the number of plants. Convert grams to kilograms.
3.  **Model the Yield Curve:** Based on the plant type ('{{{analysis.plantType}}}') and the initial stage distribution, project how these fruits will mature over the next {{{controls.forecastDays}}} days. Create a series of data points (date, yieldKg) showing the cumulative harvestable (mature) yield over time. Assume standard growth cycles for the plant type.
4.  **Determine Peak Harvest Date:** Identify the date when the largest amount of fruit becomes ready for harvest.
5.  **Provide Confidence & Notes:** Assign a confidence score based on the input data's completeness (e.g., more flowers and immature fruits lead to lower confidence). Add a brief note explaining the forecast basis.

**Example Output for a Lemon Plant:**
\`\`\`json
{
  "totalExpectedYieldKg": 152.5,
  "peakHarvestDate": "2024-08-15",
  "yieldCurve": [
    { "date": "2024-07-20", "yieldKg": 10.2 },
    { "date": "2024-07-27", "yieldKg": 45.8 },
    { "date": "2024-08-05", "yieldKg": 98.1 },
    { "date": "2024-08-15", "yieldKg": 140.3 },
    { "date": "2024-08-25", "yieldKg": 150.7 }
  ],
  "confidence": 0.75,
  "notes": "Forecast based on a high count of immature fruit. Actual yield may vary based on weather and farm conditions."
}
\`\`\`

Do not include the backticks in your response.
`,
});

const forecastYieldFlow = ai.defineFlow(
  {
    name: 'forecastYieldFlow',
    inputSchema: YieldForecastInputSchema,
    outputSchema: YieldForecastOutputSchema,
  },
  async (input) => {
    const { output } = await forecastPrompt(input);
    if (!output) {
      throw new Error('Yield forecast failed: No output from model.');
    }
    return output;
  }
);
