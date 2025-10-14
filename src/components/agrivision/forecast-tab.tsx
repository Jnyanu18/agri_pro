"use client";

import type { ForecastResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Area, AreaChart } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { CircleDollarSign, Package, Shovel } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h3 className="font-headline text-xl font-semibold">No Forecast Data</h3>
        <p className="text-muted-foreground">Upload an image and run the analysis to generate a yield forecast.</p>
      </div>
    );
  }

  const { yield_now_kg, sellable_kg, daily, harvest_plan } = result;

  const chartConfig = {
    ready_kg: {
      label: 'Ready to Harvest (kg)',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-base">Current Yield</CardTitle>
            <CardDescription>Estimated total yield from mature fruit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(yield_now_kg)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-base">Sellable Yield</CardTitle>
            <CardDescription>After post-harvest loss ({formatNumber(result.sellable_kg/yield_now_kg * 100, 0)}%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(sellable_kg)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-base">Total Forecasted</CardTitle>
            <CardDescription>Total harvestable in forecast period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(harvest_plan.reduce((a, b) => a + b.harvest_kg, 0))} kg</div>
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
                <YAxis />
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
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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
