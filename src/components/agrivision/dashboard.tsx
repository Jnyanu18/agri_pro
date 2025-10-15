

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Camera, LineChart, MessageCircle, BarChart as BarChartIcon } from 'lucide-react';
import type { AppControls, DetectionResult, ForecastResult, ChatMessage, PlantAnalysisResult, StageCounts, WeatherData } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgriVisionHeader } from '@/components/agrivision/header';
import { SidebarControls } from '@/components/agrivision/sidebar-controls';
import { DetectionTab } from '@/components/agrivision/detection-tab';
import { ForecastTab } from '@/components/agrivision/forecast-tab';
import { MarketTab } from '@/components/agrivision/market-tab';
import { ChatTab } from '@/components/agrivision/chat-tab';
import { calculateYieldForecast as calculateMockYieldForecast } from '@/lib/mock-data';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { useToast } from '@/hooks/use-toast';
import { runPlantAnalysis, runAIForecast } from '@/app/actions';
import { dataURLtoFile } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportPage } from './report-page';
import { useTranslation } from 'react-i18next';


// This function now lives on the client to process data from the AI flow
const calculateYieldForecastWithWeather = (
    stageCounts: StageCounts,
    weatherData: WeatherData[],
    controls: AppControls
): ForecastResult => {
    const { avgWeightG, postHarvestLossPct, numPlants, forecastDays, gddBaseC, harvestCapacityKgDay } = controls;

    const totalDetections = (stageCounts.immature || 0) + (stageCounts.ripening || 0) + (stageCounts.mature || 0) + (stageCounts.breaker || 0) + (stageCounts.pink || 0);
    const yield_now_kg_per_plant = ((stageCounts.mature || 0) * avgWeightG) / 1000;
    const yield_now_kg = yield_now_kg_per_plant * numPlants;
    const sellable_kg = yield_now_kg * (1 - postHarvestLossPct / 100);

    const daily: ForecastResult['daily'] = [];
    const breakerGDD = 70;
    const ripeningGDD = 80;
    const pinkGDD = 40;
    const maturingGDD = 55;
    
    let immatureCount = stageCounts.immature || 0;
    let breakerCount = stageCounts.breaker || 0;
    let ripeningCount = stageCounts.ripening || 0;
    let pinkCount = stageCounts.pink || 0;
    
    let cumGDD = 0;

    for (let i = 0; i < Math.min(forecastDays, weatherData.length); i++) {
        const dayWeather = weatherData[i];
        const date = dayWeather.date;
        const avgTemp = (dayWeather.temp_max_c + dayWeather.temp_min_c) / 2;
        const dailyGDD = Math.max(0, avgTemp - gddBaseC);
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
    
    return {
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
};


export function Dashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('detection');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [image, setImage] = useState<{ url: string | null; file: File | null, contentType: string | null }>({
    url: PlaceHolderImages[0]?.imageUrl || null,
    file: null,
    contentType: 'image/jpeg', // Default for picsum
  });

  const [controls, setControls] = useState<AppControls>({
    avgWeightG: 85,
    postHarvestLossPct: 7,
    numPlants: 10,
    forecastDays: 14,
    gddBaseC: 10,
    harvestCapacityKgDay: 20,
    useDetectionModel: true,
    useLiveWeather: false,
    includePriceForecast: true,
    district: "Coimbatore",
  });

  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [marketResult, setMarketResult] = useState<MarketPriceForecastingOutput | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleImageUpload = (file: File) => {
    const newImageUrl = URL.createObjectURL(file);
    setImage({ url: newImageUrl, file, contentType: file.type });
    // Clear previous results when a new image is uploaded for a better user experience
    setDetectionResult(null);
    setForecastResult(null);
    setMarketResult(null);
  };
  
  const handleAnalysis = useCallback(async () => {
    if (!image.url) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    setIsLoading(true);
    setDetectionResult(null);
    setForecastResult(null);

    try {
      // Step 1: Always run detection
      let analysisResult: DetectionResult;
      
      const reader = new FileReader();
      reader.readAsDataURL(image.file || await dataURLtoFile(image.url, 'analysis-image.jpg', image.contentType ?? 'image/jpeg'));
      
      analysisResult = await new Promise<DetectionResult>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const photoDataUri = reader.result as string;
            const response = await runPlantAnalysis({ photoDataUri, contentType: image.contentType! });

            if (!response.success || !response.data) {
                let errorMessage = response.error || 'An unknown error occurred during analysis.';
                if (errorMessage.includes('API key not valid')) {
                    errorMessage = 'Your Gemini API key is not valid. Please check your .env file.';
                }
                throw new Error(errorMessage);
            }

            const analysis: PlantAnalysisResult = response.data;
            
            const totalDetections = analysis.stages.reduce((sum, stage) => sum + (stage.stage.toLowerCase() !== 'flower' ? stage.count : 0), 0);
            
            // Convert array of stages to StageCounts object
            const stageCounts = analysis.stages.reduce((acc, s) => {
                acc[s.stage.toLowerCase() as keyof StageCounts] = s.count;
                return acc;
            }, {} as StageCounts);

            resolve({
              plantId: Date.now(),
              plantType: analysis.plantType,
              detections: totalDetections,
              boxes: [], 
              stageCounts: stageCounts,
              stages: analysis.stages,
              growthStage: 'Ripening', // This needs to be determined more dynamically
              avgBboxArea: 0, 
              confidence: 0.9, 
              imageUrl: image.url!,
              summary: analysis.summary
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => {
          reject(new Error("Failed to read image file."));
        }
      });
      
      setDetectionResult(analysisResult);

      // Step 2: Run forecast based on detection results
      if (analysisResult) {
          let forecast: ForecastResult;
          if (controls.useLiveWeather) {
              const forecastResponse = await runAIForecast({
                  district: controls.district,
                  forecastDays: controls.forecastDays,
              });
              if (!forecastResponse.success || !forecastResponse.data) {
                  throw new Error(forecastResponse.error || "AI forecast failed.");
              }
              forecast = calculateYieldForecastWithWeather(analysisResult.stageCounts, forecastResponse.data, controls);
          } else {
              // Use the old client-side calculation as a fallback
              forecast = calculateMockYieldForecast(analysisResult, controls);
          }
          setForecastResult(forecast);
          setActiveTab('forecast');
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [image, controls, toast]);
  
  React.useEffect(() => {
    // Recalculate forecast whenever controls change AND a detection result exists
    if(detectionResult && !controls.useLiveWeather) {
      const forecast = calculateMockYieldForecast(detectionResult, controls);
      setForecastResult(forecast);
    }
    // If useLiveWeather is on, re-running the full analysis is required, so we don't auto-recalculate here.
  }, [controls, detectionResult]);

  const appState = useMemo(() => ({
    controls,
    detectionResult,
    forecastResult,
    marketResult
  }), [controls, detectionResult, forecastResult, marketResult]);

  const navItems = [
    { id: 'detection', label: t('detection_stage'), icon: Camera },
    { id: 'forecast', label: t('forecast_dashboard'), icon: BarChartIcon },
    { id: 'market', label: t('price_profit'), icon: LineChart },
    { id: 'chat', label: t('chat_assistant'), icon: MessageCircle },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 print:bg-white">
      <Sidebar variant="inset" side="left" collapsible="icon" className="group/sidebar print:hidden">
        <SidebarHeader>
           <h2 className="font-headline text-xl font-semibold text-primary">{t('agrivision_ai')}</h2>
        </SidebarHeader>
        <SidebarContent>
           <SidebarControls controls={controls} setControls={setControls} onImageUpload={handleImageUpload} onAnalyze={handleAnalysis} isLoading={isLoading} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col print:m-0 print:min-h-fit print:shadow-none">
        <AgriVisionHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={isMobile ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-4'}>
              {navItems.map(item => (
                <TabsTrigger key={item.id} value={item.id} className="gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="detection">
              <DetectionTab result={detectionResult} isLoading={isLoading} imageUrl={image.url}/>
            </TabsContent>
            <TabsContent value="forecast">
              <ForecastTab result={forecastResult} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="market">
              <MarketTab 
                sellableKg={forecastResult?.sellable_kg || 0}
                district={controls.district}
                onMarketResultChange={setMarketResult}
              />
            </TabsContent>
            <TabsContent value="chat">
              <ChatTab 
                appState={appState}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
              />
            </TabsContent>
          </Tabs>
        </main>
        <ReportPage
            imageUrl={image.url}
            detectionResult={detectionResult}
            forecastResult={forecastResult}
            marketResult={marketResult}
            controls={controls}
        />
      </SidebarInset>
    </div>
  );
}
