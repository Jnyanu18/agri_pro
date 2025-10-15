

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Camera, LineChart, MessageCircle, BarChart as BarChartIcon, Wheat } from 'lucide-react';
import type { AppControls, DetectionResult, ForecastResult, ChatMessage, PlantAnalysisResult, YieldForecastOutput } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgriVisionHeader } from '@/components/agrivision/header';
import { SidebarControls } from '@/components/agrivision/sidebar-controls';
import { DetectionTab } from '@/components/agrivision/detection-tab';
import { HarvestForecastTab } from '@/components/agrivision/harvest-forecast-tab';
import { MarketTab } from '@/components/agrivision/market-tab';
import { ChatTab } from '@/components/agrivision/chat-tab';
import { calculateYieldForecast as calculateMockHarvestForecast } from '@/lib/mock-data';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { useToast } from '@/hooks/use-toast';
import { runPlantAnalysis, runYieldForecast } from '@/app/actions';
import { dataURLtoFile } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportPage } from './report-page';
import { useTranslation } from 'react-i18next';
import { YieldForecastTab } from './yield-forecast-tab';

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

  const [plantAnalysisResult, setPlantAnalysisResult] = useState<PlantAnalysisResult | null>(null);
  const [harvestForecastResult, setHarvestForecastResult] = useState<ForecastResult | null>(null);
  const [yieldForecastResult, setYieldForecastResult] = useState<YieldForecastOutput | null>(null);
  const [marketResult, setMarketResult] = useState<MarketPriceForecastingOutput | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleImageUpload = (file: File) => {
    const newImageUrl = URL.createObjectURL(file);
    setImage({ url: newImageUrl, file, contentType: file.type });
    // Clear previous results when a new image is uploaded for a better user experience
    setPlantAnalysisResult(null);
    setHarvestForecastResult(null);
    setYieldForecastResult(null);
    setMarketResult(null);
  };
  
  const handleAnalysis = useCallback(async () => {
    if (!image.url) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    setIsLoading(true);
    setPlantAnalysisResult(null);
    setHarvestForecastResult(null);
    setYieldForecastResult(null);

    try {
      // Step 1: Always run plant analysis
      let analysis: PlantAnalysisResult;
      
      const reader = new FileReader();
      const fileToRead = image.file || await dataURLtoFile(image.url, 'analysis-image.jpg', image.contentType ?? 'image/jpeg');
      reader.readAsDataURL(fileToRead);
      
      analysis = await new Promise<PlantAnalysisResult>((resolve, reject) => {
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
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => {
          reject(new Error("Failed to read image file."));
        }
      });
      
      setPlantAnalysisResult(analysis);
      
      const detectionResultForForecast: DetectionResult = {
          plantId: Date.now(),
          plantType: analysis.plantType,
          detections: analysis.stages.reduce((sum, stage) => sum + (stage.stage.toLowerCase() !== 'flower' ? stage.count : 0), 0),
          boxes: [],
          stageCounts: analysis.stages.reduce((acc, s) => {
              acc[s.stage.toLowerCase() as keyof typeof acc] = s.count;
              return acc;
          }, {} as any),
          stages: analysis.stages,
          growthStage: 'Varies',
          avgBboxArea: 0, 
          confidence: 0.9, 
          imageUrl: image.url!,
          summary: analysis.summary
      };

      // Step 2: Run short-term harvest forecast (mock or future AI)
      const harvestForecast = calculateMockHarvestForecast(detectionResultForForecast, controls);
      setHarvestForecastResult(harvestForecast);
      setActiveTab('harvest-forecast');

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [image, controls, toast]);

  const handleYieldForecast = useCallback(async () => {
    if (!plantAnalysisResult) {
        toast({ variant: "destructive", title: "No Analysis Data", description: "Please run the initial analysis first." });
        return;
    }
    setIsLoading(true);
    setYieldForecastResult(null);
    try {
        const response = await runYieldForecast({
            analysis: plantAnalysisResult,
            controls: controls
        });
        if (!response.success || !response.data) {
            throw new Error(response.error || "AI yield forecast failed.");
        }
        setYieldForecastResult(response.data);
        setActiveTab('yield-forecast');
    } catch (error) {
        console.error("Yield forecast failed:", error);
        toast({ variant: "destructive", title: "Yield Forecast Failed", description: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
        setIsLoading(false);
    }
  }, [plantAnalysisResult, controls, toast]);
  
  React.useEffect(() => {
    // Recalculate short-term harvest forecast whenever controls change AND a detection result exists
    if(plantAnalysisResult) {
      const detectionResultForForecast: DetectionResult = {
          plantId: Date.now(),
          plantType: plantAnalysisResult.plantType,
          detections: plantAnalysisResult.stages.reduce((sum, stage) => sum + (stage.stage.toLowerCase() !== 'flower' ? stage.count : 0), 0),
          boxes: [],
          stageCounts: plantAnalysisResult.stages.reduce((acc, s) => {
              acc[s.stage.toLowerCase() as keyof typeof acc] = s.count;
              return acc;
          }, {} as any),
          stages: plantAnalysisResult.stages,
          growthStage: 'Varies',
          avgBboxArea: 0, 
          confidence: 0.9, 
          imageUrl: image.url!,
          summary: plantAnalysisResult.summary
      };
      const forecast = calculateMockHarvestForecast(detectionResultForForecast, controls);
      setHarvestForecastResult(forecast);
    }
  }, [controls, plantAnalysisResult, image.url]);

  const appState = useMemo(() => ({
    controls,
    detectionResult: plantAnalysisResult,
    forecastResult: harvestForecastResult, // For chat, we use the harvest forecast
    marketResult
  }), [controls, plantAnalysisResult, harvestForecastResult, marketResult]);

  const navItems = [
    { id: 'detection', label: t('detection_stage'), icon: Camera },
    { id: 'harvest-forecast', label: t('harvest_forecast'), icon: BarChartIcon },
    { id: 'yield-forecast', label: t('yield_forecast'), icon: Wheat },
    { id: 'market', label: t('price_profit'), icon: LineChart },
    { id: 'chat', label: t('chat_assistant'), icon: MessageCircle },
  ];

  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-muted/40 print:bg-white md:grid-cols-[var(--sidebar-width)_1fr]">
      <Sidebar variant="inset" side="left" collapsible="icon" className="group/sidebar print:hidden">
        <SidebarHeader>
           <h2 className="font-headline text-xl font-semibold text-primary">{t('agrivision_ai')}</h2>
        </SidebarHeader>
        <SidebarContent>
           <SidebarControls 
                controls={controls} 
                setControls={setControls} 
                onImageUpload={handleImageUpload} 
                onAnalyze={handleAnalysis} 
                onYieldForecast={handleYieldForecast}
                isAnalysisLoading={isLoading} 
                isForecastLoading={isLoading}
                isYieldForecastDisabled={!plantAnalysisResult}
            />
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col print:m-0 print:min-h-fit print:shadow-none">
        <AgriVisionHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={isMobile ? 'grid w-full grid-cols-3' : 'grid w-full grid-cols-5'}>
              {navItems.map(item => (
                <TabsTrigger key={item.id} value={item.id} className="gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="detection">
              <DetectionTab result={plantAnalysisResult ? {
                  plantId: Date.now(),
                  plantType: plantAnalysisResult.plantType,
                  detections: plantAnalysisResult.stages.reduce((sum, stage) => sum + (stage.stage.toLowerCase() !== 'flower' ? stage.count : 0), 0),
                  boxes: [],
                  stageCounts: plantAnalysisResult.stages.reduce((acc, s) => {
                      acc[s.stage.toLowerCase() as keyof typeof acc] = s.count;
                      return acc;
                  }, {} as any),
                  stages: plantAnalysisResult.stages,
                  growthStage: 'Varies',
                  avgBboxArea: 0, 
                  confidence: 0.9, 
                  imageUrl: image.url!,
                  summary: plantAnalysisResult.summary
              } : null} isLoading={isLoading} imageUrl={image.url}/>
            </TabsContent>
            <TabsContent value="harvest-forecast">
              <HarvestForecastTab result={harvestForecastResult} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="yield-forecast">
                <YieldForecastTab result={yieldForecastResult} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="market">
              <MarketTab 
                sellableKg={harvestForecastResult?.sellable_kg || 0}
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
            detectionResult={plantAnalysisResult ? {
                plantId: Date.now(),
                plantType: plantAnalysisResult.plantType,
                detections: plantAnalysisResult.stages.reduce((sum, stage) => sum + (stage.stage.toLowerCase() !== 'flower' ? stage.count : 0), 0),
                boxes: [],
                stageCounts: plantAnalysisResult.stages.reduce((acc, s) => {
                    acc[s.stage.toLowerCase() as keyof typeof acc] = s.count;
                    return acc;
                }, {} as any),
                stages: plantAnalysisResult.stages,
                growthStage: 'Varies',
                avgBboxArea: 0, 
                confidence: 0.9, 
                imageUrl: image.url!,
                summary: plantAnalysisResult.summary
            } : null}
            forecastResult={harvestForecastResult}
            marketResult={marketResult}
            controls={controls}
        />
      </div>
    </div>
  );
}
