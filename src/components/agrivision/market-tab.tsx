"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import { runMarketPriceForecasting } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CalendarCheck, DollarSign, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';

interface MarketTabProps {
  sellableKg: number;
  district: string;
  onMarketResultChange: (result: MarketPriceForecastingOutput | null) => void;
}

const formSchema = z.object({
  district: z.string().min(2, { message: 'District is required.' }),
  daysAhead: z.coerce.number().min(7, { message: 'Must be at least 7 days.' }).max(30, { message: 'Cannot exceed 30 days.' }),
});

export function MarketTab({ sellableKg, district, onMarketResultChange }: MarketTabProps) {
  const [result, setResult] = useState<MarketPriceForecastingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      district: district || 'Coimbatore',
      daysAhead: 14,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    onMarketResultChange(null);
    
    const response = await runMarketPriceForecasting({ ...values, readyKg: sellableKg });
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      onMarketResultChange(response.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Forecast Failed',
        description: response.error,
      });
    }
  }

  const chartConfig = {
    price: { label: 'Price (₹/kg)', color: 'hsl(var(--primary))' },
  };
  
  const expectedRevenue = result ? sellableKg * result.bestPrice : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Market Forecast</CardTitle>
            <CardDescription>Predict future tomato prices to find the best time to sell.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Coimbatore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="daysAhead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forecast Days</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Forecasting...' : 'Forecast Prices'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {result && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profit Outlook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="text-sm">
                            <div className="text-muted-foreground">Best Sell Date</div>
                            <div className="font-bold text-lg">{new Date(result.bestDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                        </div>
                        <CalendarCheck className="w-8 h-8 text-primary"/>
                    </div>
                     <div className="flex items-start justify-between">
                        <div className="text-sm">
                            <div className="text-muted-foreground">Est. Price</div>
                            <div className="font-bold text-lg">₹{formatNumber(result.bestPrice)} / kg</div>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary"/>
                    </div>
                     <div className="flex items-start justify-between">
                        <div className="text-sm">
                            <div className="text-muted-foreground">Expected Revenue</div>
                            <div className="font-bold text-lg">₹{formatNumber(expectedRevenue)}</div>
                        </div>
                        <DollarSign className="w-8 h-8 text-primary"/>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
      <div className="md:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="font-headline">Price Forecast Chart</CardTitle>
            <CardDescription>
              {result ? `Price trend for ${form.getValues('district')} over the next ${form.getValues('daysAhead')} days.` : 'Run a forecast to see price trends.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : 
            !result ? (
                <div className="flex flex-col h-[400px] items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center">
                    <LineChartIcon className="h-16 w-16 text-muted-foreground" />
                    <h3 className="font-headline text-xl font-semibold">No Price Data</h3>
                    <p className="text-muted-foreground">Your price forecast chart will appear here.</p>
                </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <LineChart data={result.forecast} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} name="Price" dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
