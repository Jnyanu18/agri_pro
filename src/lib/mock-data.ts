
import { addDays, format } from 'date-fns';
import type { AppControls, DetectionBox, DetectionResult, ForecastResult, Stage, StageCounts } from './types';

// Mocks the output of a tomato detection model.
export function mockTomatoDetection(imageUrl: string): DetectionResult {
  const detections = Math.floor(Math.random() * 25) + 10; // 10 to 34 detections
  const stages: Stage[] = ['immature', 'ripening', 'mature', 'flower', 'breaker', 'pink'];
  const stageCounts: StageCounts = { immature: 0, ripening: 0, mature: 0, flower: 0, breaker: 0, pink: 0 };
  const boxes: DetectionBox[] = [];

  for (let i = 0; i < detections; i++) {
    const stage = stages[Math.floor(Math.random() * stages.length)];
    stageCounts[stage]++;

    if (stage === 'flower') continue; // Flowers don't have boxes in this mock

    const x1 = Math.random() * 0.8;
    const y1 = Math.random() * 0.8;
    const boxWidth = 0.05 + Math.random() * 0.1;
    const boxHeight = 0.05 + Math.random() * 0.1;
    boxes.push({
      box: [x1, y1, x1 + boxWidth, y1 + boxHeight],
      stage,
    });
  }

  const growthStage = stageCounts.mature > detections / 2 ? 'Mature' : stageCounts.ripening > detections / 3 ? 'Ripening' : 'Immature';
  const avgBboxArea = boxes.reduce((acc, { box }) => acc + (box[2] - box[0]) * (box[3] - box[1]), 0) / boxes.length;

  return {
    plantId: 1,
    detections,
    boxes,
    stageCounts,
    growthStage,
    avgBboxArea,
    confidence: 0.85 + Math.random() * 0.1,
    imageUrl,
  };
}

// Mocks the yield forecasting and harvest scheduling logic.
export function calculateYieldForecast(
  detectionResult: DetectionResult,
  controls: AppControls
): ForecastResult {
  const { stageCounts } = detectionResult;
  const { avgWeightG, postHarvestLossPct, numPlants, forecastDays, gddBaseC, harvestCapacityKgDay } = controls;

  const totalDetections = stageCounts.immature + stageCounts.ripening + stageCounts.mature + (stageCounts.breaker || 0) + (stageCounts.pink || 0);
  const yield_now_kg_per_plant = (stageCounts.mature * avgWeightG) / 1000;
  const yield_now_kg = yield_now_kg_per_plant * numPlants;
  const sellable_kg = yield_now_kg * (1 - postHarvestLossPct / 100);

  // Simulate GDD and ripening
  const daily: ForecastResult['daily'] = [];
  const breakerGDD = 70;
  const ripeningGDD = 80;
  const pinkGDD = 40;
  const maturingGDD = 55;
  
  let immatureCount = stageCounts.immature;
  let breakerCount = stageCounts.breaker || 0;
  let ripeningCount = stageCounts.ripening;
  let pinkCount = stageCounts.pink || 0;
  
  let cumGDD = 0;

  for (let i = 0; i < forecastDays; i++) {
    const date = addDays(new Date(), i);
    const dailyGDD = gddBaseC / 2 + Math.random() * 8; // Synthetic GDD
    cumGDD += dailyGDD;

    const newBreaker = immatureCount * Math.min(1, (dailyGDD / breakerGDD));
    const newRipening = breakerCount * Math.min(1, (dailyGDD / ripeningGDD));
    const newPink = ripeningCount * Math.min(1, (dailyGDD / pinkGDD));
    const newMature = pinkCount * Math.min(1, (dailyGDD / maturingGDD));
    
    immatureCount -= newBreaker;
    breakerCount += newBreaker - newRipening;
    ripeningCount += newRipening - newPink;
    pinkCount += newPink - newMature;
    const matureCount = totalDetections - immatureCount - breakerCount - ripeningCount - pinkCount;

    daily.push({
      date: format(date, 'yyyy-MM-dd'),
      ready_kg: (matureCount * avgWeightG / 1000) * numPlants,
      gdd_cum: cumGDD,
    });
  }

  // Greedy harvest scheduling
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

  return {
    yield_now_kg,
    sellable_kg,
    daily,
    harvest_plan,
    harvestWindow,
    notes: [
      `Forecast assumes an average daily GDD accumulation.`,
      `Harvest plan is optimized for a capacity of ${harvestCapacityKgDay} kg/day.`,
    ],
  };
}
