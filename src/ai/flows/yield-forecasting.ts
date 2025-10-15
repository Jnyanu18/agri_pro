
'use server';

/**
 * @fileOverview An AI-powered flow to fetch weather data for yield forecasting.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getWeatherForecast } from '@/ai/tools/weather';
import { WeatherDataSchema } from '@/lib/types';

// New, simplified input for the flow
const WeatherForYieldInputSchema = z.object({
  district: z.string(),
  forecastDays: z.number(),
});
export type WeatherForYieldInput = z.infer<typeof WeatherForYieldInputSchema>;


export async function runWeatherForYield(input: WeatherForYieldInput) {
  console.log('[WeatherForYield Flow] Starting...');
  const weatherResponse = await ai.generate({
      prompt: `Get the weather forecast for ${input.district} for the next ${input.forecastDays} days.`,
      tools: [getWeatherForecast],
      model: 'googleai/gemini-2.5-flash',
  });

  const weatherToolOutput = weatherResponse.toolRequest?.tool?.('getWeatherForecast')?.output;
  if (!weatherToolOutput) {
    throw new Error('Could not retrieve weather data.');
  }

  // The output of the tool already matches the z.array(WeatherDataSchema)
  return weatherToolOutput;
}
