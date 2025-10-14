
'use server';

/**
 * @fileOverview An AI-powered flow to forecast tomato yield using weather data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getWeatherForecast } from '@/ai/tools/weather';
import { YieldForecastingInputSchema, ForecastResultSchema, type ForecastResult } from '@/lib/types';


export type YieldForecastingInput = z.infer<typeof YieldForecastingInputSchema>;

export async function runYieldForecasting(input: YieldForecastingInput): Promise<ForecastResult> {
  return yieldForecastingFlow(input);
}

const yieldForecastingFlow = ai.defineFlow(
  {
    name: 'yieldForecastingFlow',
    inputSchema: YieldForecastingInputSchema,
    outputSchema: ForecastResultSchema,
    tools: [getWeatherForecast],
  },
  async (input) => {
    console.log('[Yield Forecasting Flow] Starting AI-powered forecast...');

    const { controls, stageCounts } = input;
    
    // The model will decide to call this tool based on the prompt.
    const weatherResponse = await ai.generate({
      prompt: `Get the weather forecast for ${controls.district} for the next ${controls.forecastDays} days.`,
      tools: [getWeatherForecast],
      model: 'googleai/gemini-2.5-flash',
    });

    const weatherToolOutput = weatherResponse.toolRequest?.tool?.('getWeatherForecast')?.output;

    if (!weatherToolOutput) {
      throw new Error('Could not retrieve weather data to perform forecast.');
    }
    
    const weatherData = weatherToolOutput;

    // --- Start of calculation logic based on weather ---
    const { avgWeightG, postHarvestLossPct, numPlants, forecastDays, gddBaseC, harvestCapacityKgDay } = controls;

    const totalDetections = stageCounts.immature + stageCounts.ripening + stageCounts.mature;
    const yield_now_kg_per_plant = (stageCounts.mature * avgWeightG) / 1000;
    const yield_now_kg = yield_now_kg_per_plant * numPlants;
    const sellable_kg = yield_now_kg * (1 - postHarvestLossPct / 100);

    const daily: ForecastResult['daily'] = [];
    const ripeningGDD = 80;
    const maturingGDD = 55;
    
    let immatureCount = stageCounts.immature;
    let ripeningCount = stageCounts.ripening;
    let cumGDD = 0;

    for (let i = 0; i < Math.min(forecastDays, weatherData.length); i++) {
        const dayWeather = weatherData[i];
        const date = dayWeather.date;
        const avgTemp = (dayWeather.temp_max_c + dayWeather.temp_min_c) / 2;
        const dailyGDD = Math.max(0, avgTemp - gddBaseC);
        cumGDD += dailyGDD;

        const newRipening = immatureCount * Math.min(1, (dailyGDD / ripeningGDD));
        const newMature = ripeningCount * Math.min(1, (dailyGDD / maturingGDD));
        
        immatureCount -= newRipening;
        ripeningCount = ripeningCount - newMature + newRipening;
        const matureCount = totalDetections - immatureCount - ripeningCount;

        daily.push({
            date: date,
            ready_kg: (matureCount * avgWeightG / 1000) * numPlants,
            gdd_cum: cumGDD,
        });
    }

    const harvest_plan: ForecastResult['harvest_plan'] = [];
    let cumulativeReadyKg = 0;
    let lastHarvestedKg = 0;
    for (const day of daily) {
        cumulativeReadyKg += (day.ready_kg - lastHarvestedKg);
        const canHarvest = Math.min(cumulativeReadyKg, harvestCapacityKgDay);
        if(canHarvest > 0.1) {
            harvest_plan.push({
                date: day.date,
                harvest_kg: canHarvest,
            });
            cumulativeReadyKg -= canHarvest;
        }
        lastHarvestedKg = day.ready_kg;
    }
    
    const harvestWindow = harvest_plan.length > 0
        ? { start: harvest_plan[0].date, end: harvest_plan[harvest_plan.length - 1].date }
        : undefined;
    
    const result: ForecastResult = {
        yield_now_kg,
        sellable_kg,
        daily,
        harvest_plan,
        harvestWindow,
        notes: [
            `Forecast is based on a weather prediction for ${controls.district}.`,
            `Harvest plan is optimized for a capacity of ${harvestCapacityKgDay} kg/day.`,
        ],
    };

    console.log('[Yield Forecasting Flow] Completed. Result:', result);
    return result;
  }
);
