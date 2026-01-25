
'use server';

import type { ChatAssistantForInsightsInput } from '@/ai/flows/chat-assistant-for-insights';
import type { MarketPriceForecastingInput, MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import type { AnalyzePlantInput, PlantAnalysisResult, YieldForecastInput, YieldForecastOutput } from '@/lib/types';

// IMPORTANT: This base URL needs to be configured for production.
// In a Vercel environment, process.env.VERCEL_URL will be set automatically.
const getBaseUrl = () => {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback for local development. Make sure your Next.js app is running on this port.
    return 'http://localhost:9002';
};

const GENKIT_API_BASE = `${getBaseUrl()}/api/genkit`;

async function runFlow<Input, Output>(flowId: string, input: Input): Promise<{ success: boolean, data?: Output, error?: string }> {
    try {
        const response = await fetch(`${GENKIT_API_BASE}/${flowId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });

        const result = await response.json();

        if (!response.ok) {
             const errorDetail = result?.error || `Request failed with status ${response.status}`;
             throw new Error(errorDetail);
        }

        return { success: true, data: result as Output };
    } catch (error) {
        console.error(`Error running flow '${flowId}':`, error);
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message.includes('API key not valid') 
                ? 'Your Gemini API key is not valid. Please check your environment variables.'
                : error.message;
        }
        return { success: false, error: errorMessage };
    }
}


export async function runMarketPriceForecasting(input: MarketPriceForecastingInput) {
    // The Genkit Next.js runner expects the input to be wrapped in an 'input' object
    return runFlow<MarketPriceForecastingInput, MarketPriceForecastingOutput>('marketPriceForecastingFlow', input);
}

export async function runChatAssistant(input: ChatAssistantForInsightsInput) {
    return runFlow<ChatAssistantForInsightsInput, { reply: string }>('chatAssistantForInsightsFlow', input);
}

export async function runPlantAnalysis(input: AnalyzePlantInput) {
    return runFlow<AnalyzePlantInput, PlantAnalysisResult>('analyzePlantFlow', input);
}

export async function runYieldForecast(input: YieldForecastInput): Promise<{ success: boolean, data?: YieldForecastOutput, error?: string }> {
    return runFlow<YieldForecastInput, YieldForecastOutput>('forecastYieldFlow', input);
}
