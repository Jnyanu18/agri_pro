
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DetectionResult, Stage } from "@/lib/types";
import { ImageWithBoxes } from "./image-with-boxes";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DetectionTabProps {
  result: DetectionResult | null;
  isLoading: boolean;
  imageUrl: string | null;
}

const stageColors: { [key: string]: string } = {
  flower: "bg-pink-400",
  immature: "bg-green-500",
  breaker: "bg-lime-400",
  ripening: "bg-amber-500",
  pink: "bg-rose-400",
  mature: "bg-red-500",
  fruitlet: "bg-yellow-300",
  default: "bg-gray-400",
};

const getStageColor = (stage: string) => {
  return stageColors[stage.toLowerCase()] || stageColors.default;
}

export function DetectionTab({ result, isLoading, imageUrl }: DetectionTabProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return <DetectionSkeleton />;
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center">
        <UploadCloud className="h-16 w-16 text-muted-foreground" />
        <h3 className="font-headline text-xl font-semibold">{t('start_analysis_title')}</h3>
        <p className="text-muted-foreground">{t('start_analysis_desc')}</p>
      </div>
    );
  }

  if (!result) {
    return (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">{t('awaiting_analysis_title')}</CardTitle>
            <CardDescription>
              {t('awaiting_analysis_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video overflow-hidden rounded-lg border">
                <Image 
                    src={imageUrl} 
                    alt="Ready for analysis" 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
          </CardContent>
        </Card>
    );
  }

  const { detections, stages, boxes, summary, plantType } = result;

  const totalFruits = stages.reduce((sum, s) => sum + (s.stage.toLowerCase() !== 'flower' ? s.count : 0), 0);
  
  const maturityDistribution = totalFruits > 0 ? stages
    .filter(s => s.stage.toLowerCase() !== 'flower')
    .map(s => ({
        stage: s.stage,
        value: (s.count / totalFruits) * 100,
        color: getStageColor(s.stage)
    })) : [];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">{t('detection_result_for', { plant: plantType })}</CardTitle>
          <CardDescription>
            {summary || t('analyzed_image_summary', { count: detections })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageWithBoxes imageUrl={result.imageUrl} boxes={boxes} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('stage_classification')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {totalFruits > 0 && (
                <div className="flex rounded-full overflow-hidden h-3">
                {maturityDistribution.filter(d => d.value > 0).map(d => (
                    <div key={d.stage} style={{ width: `${d.value}%` }} className={d.color}></div>
                ))}
                </div>
            )}
            <div className="space-y-2 text-sm">
              {stages.map(({ stage, count }) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", getStageColor(stage))} />
                    <span className="capitalize">{t(stage.toLowerCase(), { defaultValue: stage })}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetectionSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
