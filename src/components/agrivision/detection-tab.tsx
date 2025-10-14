"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { DetectionResult, Stage } from "@/lib/types";
import { ImageWithBoxes } from "./image-with-boxes";
import { UploadCloud } from "lucide-react";

interface DetectionTabProps {
  result: DetectionResult | null;
  isLoading: boolean;
}

const stageColors: Record<Stage, string> = {
  immature: "border-green-500",
  ripening: "border-amber-500",
  mature: "border-red-500",
};

const stageBG: Record<Stage, string> = {
  immature: "bg-green-500",
  ripening: "bg-amber-500",
  mature: "bg-red-500",
};

export function DetectionTab({ result, isLoading }: DetectionTabProps) {
  if (isLoading) {
    return <DetectionSkeleton />;
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center">
        <UploadCloud className="h-16 w-16 text-muted-foreground" />
        <h3 className="font-headline text-xl font-semibold">Start Your Analysis</h3>
        <p className="text-muted-foreground">Upload an image of your tomato plant to begin detection.</p>
      </div>
    );
  }

  const { detections, stageCounts, imageUrl, boxes } = result;

  const maturityDistribution = [
    { stage: "immature", value: (stageCounts.immature / detections) * 100, color: "bg-green-500" },
    { stage: "ripening", value: (stageCounts.ripening / detections) * 100, color: "bg-amber-500" },
    { stage: "mature", value: (stageCounts.mature / detections) * 100, color: "bg-red-500" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Detection Result</CardTitle>
          <CardDescription>
            Analyzed image with {detections} tomatoes detected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageWithBoxes imageUrl={imageUrl} boxes={boxes} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Stage Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex rounded-full overflow-hidden h-3">
              {maturityDistribution.map(d => (
                <div key={d.stage} style={{ width: `${d.value}%` }} className={d.color}></div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stageBG[stage as Stage]}`} />
                    <span className="capitalize">{stage}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Overall Maturity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">{result.growthStage}</span>
                    <Progress value={result.confidence * 100} className="w-full" />
                    <span className="text-sm font-bold">{(result.confidence * 100).toFixed(0)}%</span>
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
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
