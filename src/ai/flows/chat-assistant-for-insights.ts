'use server';

/**
 * @fileOverview A chat assistant for providing insights about tomato yield, forecasts, and market prices.
 *
 * - chatAssistantForInsights - A function that handles the chat assistant interaction.
 * - ChatAssistantForInsightsInput - The input type for the chatAssistantForInsights function.
 * - ChatAssistantForInsightsOutput - The return type for the chatAssistantForInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantForInsightsInputSchema = z.object({
  query: z.string().describe('The user query about tomato yield, forecasts, or market prices.'),
  detectionResult: z.any().optional().describe('The latest detection result.'),
  forecastResult: z.any().optional().describe('The latest forecast result.'),
  marketResult: z.any().optional().describe('The latest market result.'),
});
export type ChatAssistantForInsightsInput = z.infer<typeof ChatAssistantForInsightsInputSchema>;

const ChatAssistantForInsightsOutputSchema = z.object({
  reply: z.string().describe('The reply from the chat assistant.'),
});
export type ChatAssistantForInsightsOutput = z.infer<typeof ChatAssistantForInsightsOutputSchema>;

export async function chatAssistantForInsights(input: ChatAssistantForInsightsInput): Promise<ChatAssistantForInsightsOutput> {
  return chatAssistantForInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAssistantForInsightsPrompt',
  input: {schema: ChatAssistantForInsightsInputSchema},
  output: {schema: ChatAssistantForInsightsOutputSchema},
  prompt: `You are a chat assistant providing insights about tomato yield, forecasts, and market prices.

  You have access to the following information:
  - Detection Result: {{detectionResult}}
  - Forecast Result: {{forecastResult}}
  - Market Result: {{marketResult}}

  Based on this information, answer the user's query: {{query}}

  If the information is not available, respond politely that you cannot answer the question. Format numbers to 2 decimals and include units (kg, ₹/kg).`,
});

const chatAssistantForInsightsFlow = ai.defineFlow(
  {
    name: 'chatAssistantForInsightsFlow',
    inputSchema: ChatAssistantForInsightsInputSchema,
    outputSchema: ChatAssistantForInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
