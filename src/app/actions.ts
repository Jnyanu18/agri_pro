
'use server';

import {
  chatAssistantForInsights,
  type ChatAssistantForInsightsInput,
} from '@/ai/flows/chat-assistant-for-insights';
import {
  marketPriceForecasting,
  type MarketPriceForecastingInput,
} from '@/ai/flows/market-price-forecasting';

export async function runMarketPriceForecasting(
  input: MarketPriceForecastingInput
) {
  try {
    const result = await marketPriceForecasting(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in market price forecasting flow:', error);
    return { success: false, error: 'Failed to forecast market prices.' };
  }
}

export async function runChatAssistant(input: ChatAssistantForInsightsInput) {
  try {
    const result = await chatAssistantForInsights(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in chat assistant flow:', error);
    return { success: false, error: 'The assistant is currently unavailable.' };
  }
}
