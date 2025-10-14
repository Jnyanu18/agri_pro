"use client";

import { Leaf, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '../ui/button';
import { BookText, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';

export function AgriVisionHeader() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
       <div className="md:hidden">
          <SidebarTrigger />
        </div>
      <div className="flex items-center gap-2">
        <Leaf className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-2xl font-bold tracking-tight">
          AgriVisionAI
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <BookText className="mr-2 h-4 w-4" />
              Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Project Report: AgriVisionAI</DialogTitle>
              <DialogDescription>
                An overview of the project's architecture, features, and technology stack.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
                <div className="space-y-6 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                        AgriVisionAI is a comprehensive, cloud-native web application designed to provide intelligent yield analysis and forecasting for tomato farmers. It leverages a modern tech stack to deliver a seamless user experience, from image upload to AI-powered insights.
                    </p>

                    <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">1. Frontend & User Interface (Next.js & ShadCN UI)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">Modern Dashboard:</span> A responsive, tab-based interface for Detection, Forecast, Market Price, and an AI Chat Assistant.</li>
                            <li><span className="font-semibold">Interactive Controls:</span> A collapsible sidebar for adjusting forecast parameters and uploading plant images.</li>
                            <li><span className="font-semibold">Authentication Flow:</span> Secure user registration and login using Firebase Authentication. The main dashboard is a protected route.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">2. AI-Powered Vision Analysis (Genkit & Gemini)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                             <li><span className="font-semibold">Tomato Detection:</span> The app uses a Genkit AI flow calling the Gemini vision model to analyze uploaded tomato plant images.</li>
                            <li><span className="font-semibold">Analysis Process:</span> The model counts all visible tomatoes and classifies them by growth stage (flower, immature, ripening, mature), returning a structured JSON object with the results.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">3. Yield & Harvest Forecasting</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">Data-Driven Forecast:</span> Tomato counts from the AI analysis are fed into a sophisticated forecasting function.</li>
                            <li><span className="font-semibold">Calculations:</span> Estimates current yield, sellable yield, and projects a "Ready-to-Harvest" curve.</li>
                             <li><span className="font-semibold">Optimal Harvest Plan:</span> Creates a daily harvest schedule based on the forecast and the user's specified harvest capacity.</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">4. Market Price Forecasting & Profit Analysis</h3>
                         <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">AI-Powered Market Insights:</span> A dedicated Genkit flow forecasts future tomato prices for a specified district.</li>
                            <li><span className="font-semibold">Profit Optimization:</span> The flow identifies the best date to sell for maximum profit and calculates expected revenue.</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">5. AI Chat Assistant</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">Context-Aware:</span> An integrated assistant answers natural language questions using the latest detection, forecast, and market data as context.</li>
                        </ul>
                    </div>

                     <div className="space-y-2">
                        <h3 className="font-headline text-lg font-semibold text-foreground">6. Firebase Integration</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">User Management:</span> Firebase Authentication handles the entire user lifecycle.</li>
                            <li><span className="font-semibold">Security:</span> The app uses standard Firebase client-side SDK practices, with security enforced by Firestore Security Rules.</li>
                        </ul>
                    </div>
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
