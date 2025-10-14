
"use client";

import type { ForecastResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as BarChartIcon, CalendarDays, PackageCheck, Shovel, Trees } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';

interface ForecastTabProps {
  result: ForecastResult | null;
  isLoading: boolean;
}

export function ForecastTab({ result, isLoading }: ForecastTabProps) {
  if (isLoading) {
    return <ForecastSkeleton />;
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center h-[50vh]">
        <BarChartIcon className="h-16 w-16 text-muted-foreground" />
        <h3 className="font-headline text-xl font-semibold">No Forecast Data</h3>
        <p className="text-muted-foreground">Upload an image and run the analysis to generate a yield forecast.</p>
      </div>
    );
  }

  const { yield_now_kg, sellable_kg, daily, harvest_plan, harvestWindow, notes } = result;

  const chartConfig = {
    ready_kg: {
      label: 'Ready to Harvest (kg)',
      color: 'hsl(var(--primary))',
    },
  };

  const totalHarvest = harvest_plan.reduce((a, b) => a + b.harvest_kg, 0);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-headline text-base">Current Yield</CardTitle>
            <Trees className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(yield_now_kg)} kg</div>
            <p className="text-xs text-muted-foreground">Est. from mature fruit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-headline text-base">Sellable Yield</CardTitle>
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(sellable_kg)} kg</div>
            <p className="text-xs text-muted-foreground">After post-harvest loss</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline text-base">Harvest Window</CardTitle>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {harvestWindow ? (
                <>
                    <div className="text-xl font-bold">
                        {format(new Date(harvestWindow.start), 'MMM d')} - {format(new Date(harvestWindow.end), 'MMM d')}
                    </div>
                    <p className="text-xs text-muted-foreground">Optimal harvest period</p>
                </>
                ) : (
                <>
                    <div className="text-xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No harvest scheduled</p>
                </>
                )}
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-headline text-base">Total Forecasted</CardTitle>
            <Shovel className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totalHarvest)} kg</div>
            <p className="text-xs text-muted-foreground">Total harvest in period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Ready to Harvest Forecast</CardTitle>
            <CardDescription>Projected amount of ripe tomatoes over the next {daily.length} days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={daily} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis unit="kg" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="ready_kg" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Ready (kg)"/>
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Harvest Plan</CardTitle>
            <CardDescription>Optimal daily harvest schedule based on capacity.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Harvest (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvest_plan.length > 0 ? harvest_plan.map(item => (
                  <TableRow key={item.date}>
                    <TableCell>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(item.harvest_kg)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No harvest scheduled in forecast period.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-2/4" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
