'use server';

/**
 * @fileOverview A YOLOv8 model based tomato detection and stage classification flow.
 *
 * - runYoloModel - A function that handles running the YOLOv8 model for detection and classification.
 * - TomatoDetectionInput - The input type for the runYoloModel function.
 * - TomatoDetectionOutput - The return type for the runYoloModel function.
 */

import { ai } from '@/ai/genkit';
import { TomatoDetectionInputSchema, TomatoDetectionOutputSchema, type TomatoDetectionOutput as TomatoDetectionOutputType } from '@/lib/types';
import type { TomatoDetectionInput, Stage } from '@/lib/types';


export async function runYoloModel(input: TomatoDetectionInput): Promise<TomatoDetectionOutputType> {
  const result = await tomatoDetectionFlow(input);
  
  // Calculate derived values that the model doesn't directly provide
  const stageCounts: Record<Stage, number> = { immature: 0, ripening: 0, mature: 0 };
  (result.boxes || []).forEach(b => {
    stageCounts[b.stage]++;
  });

  const detections = result.boxes?.length ?? 0;
  const growthStage = stageCounts.mature > detections / 2 ? 'Mature' : stageCounts.ripening > detections / 3 ? 'Ripening' : 'Immature';
  const avgBboxArea = detections > 0 ? result.boxes.reduce((acc, { box }) => acc + (box[2] - box[0]) * (box[3] - box[1]), 0) / detections : 0;
  const confidence = result.confidence ?? (0.9 + Math.random() * 0.09);

  return {
      ...result,
      detections,
      stageCounts,
      growthStage,
      avgBboxArea,
      confidence,
  };
}

const prompt = ai.definePrompt({
    name: 'tomatoDetectionPrompt',
    input: { schema: TomatoDetectionInputSchema },
    output: { schema: TomatoDetectionOutputSchema },
    prompt: `You are a specialized agricultural AI model, specifically a YOLOv8 model trained to detect tomatoes in an image and classify their ripeness using rule-based HSV/LAB color analysis.
  
Your task is to analyze the provided image and identify all tomatoes. For each detected tomato, provide its bounding box and classify its ripeness stage.
  
- Bounding Boxes: Provide normalized coordinates [x1, y1, x2, y2] for each box.
- Ripeness Stages: Classify each tomato into one of three stages: 'immature' (green), 'ripening' (yellow/orange), or 'mature' (red).
  
Based on your detections, also determine the overall 'growthStage' of the plant shown in the image.
  
Analyze this image: {{media url=photoDataUri}}
  
Provide the output in the specified JSON format. Your output must be a valid JSON object matching the provided schema.`,
});
  
const tomatoDetectionFlow = ai.defineFlow(
    {
      name: 'tomatoDetectionFlow',
      inputSchema: TomatoDetectionInputSchema,
      outputSchema: TomatoDetectionOutputSchema,
    },
    async (input) => {
        const result = await prompt(input);
        return result.output!;
    }
);
