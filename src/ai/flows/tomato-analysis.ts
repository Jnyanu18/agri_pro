
'use server';
/**
 * @fileOverview An AI flow for analyzing tomato plant images to count and classify tomatoes.
 *
 * - analyzeTomato - A function that handles the tomato analysis process.
 * - AnalyzeTomatoInput - The input type for the analyzeTomato function.
 * - TomatoAnalysisResult - The return type for the analyzeTomato function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AnalyzeTomatoInputSchema, TomatoAnalysisResultSchema } from '@/lib/types';

export type AnalyzeTomatoInput = z.infer<typeof AnalyzeTomatoInputSchema>;
export type TomatoAnalysisResult = z.infer<typeof TomatoAnalysisResultSchema>;

// Define the prompt for the AI model
const analysisPrompt = ai.definePrompt({
  name: 'tomatoAnalysisPrompt',
  input: { schema: AnalyzeTomatoInputSchema },
  output: { schema: TomatoAnalysisResultSchema, format: "json" },
  prompt: `
You are an agricultural vision assistant. 
Analyze this tomato plant image:
1. Count how many tomatoes are visible.
2. Classify each tomato into stages: flower, immature (green), ripening (orange/yellow), and mature (red).
3. Return JSON with stage counts and a short summary.

Do not include the backticks in the response.

Photo: {{media url=photoDataUri contentType=contentType}}`,
});

// Define the main flow
const analyzeTomatoFlow = ai.defineFlow(
  {
    name: 'analyzeTomatoFlow',
    inputSchema: AnalyzeTomatoInputSchema,
    outputSchema: TomatoAnalysisResultSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('Analysis failed: No output from model.');
    }
    return output;
  }
);


export async function analyzeTomato(input: AnalyzeTomatoInput): Promise<TomatoAnalysisResult> {
  return analyzeTomatoFlow(input);
}
