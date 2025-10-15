
'use client';

import Link from 'next/link';
import { Leaf, Bot, BarChart, ShoppingCart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/'); // Redirect to home page after logout
    };

    const features = [
    {
        icon: <Bot className="h-10 w-10 text-primary" />,
        title: "AI-Powered Vision Analysis",
        description: "Utilizes the Gemini vision model via Genkit to analyze tomato plant images. It counts visible tomatoes and classifies them by growth stage (flower, immature, ripening, mature), returning structured JSON for further analysis."
    },
    {
        icon: <BarChart className="h-10 w-10 text-primary" />,
        title: "Yield & Harvest Forecasting",
        description: "Feeds AI analysis data into a sophisticated forecasting function to estimate current yield, sellable yield, and project a 'Ready-to-Harvest' curve. It also generates an optimal daily harvest plan based on user-defined capacity."
    },
    {
        icon: <ShoppingCart className="h-10 w-10 text-primary" />,
        title: "Market Price & Profit Analysis",
        description: "A dedicated Genkit flow forecasts future tomato prices for a specified district, identifying the best date to sell for maximum profit and calculating expected revenue. This provides actionable insights for financial planning."
    },
];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline font-bold">AgriVisionAI</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-2">
             <nav className="flex items-center space-x-2">
                {isUserLoading ? null : user ? (
                    <>
                        <Button asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button variant="ghost" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4"/>
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" asChild>
                             <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/register">Sign Up</Link>
                        </Button>
                    </>
                )}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40">
           <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 transition-opacity duration-500 group-hover:opacity-100 dark:opacity-20"
          >
            <div className="h-56 bg-gradient-to-br from-primary to-green-300 blur-[106px] dark:from-primary/70"></div>
            <div className="h-32 bg-gradient-to-r from-emerald-400 to-lime-300 blur-[106px] dark:to-lime-500"></div>
          </div>
          <div className="container relative text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Smart Yield Intelligence for Tomato Farmers
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
              Leverage the power of AI to analyze your crops, forecast yields, and optimize your harvest for maximum profit. AgriVisionAI provides the insights you need to grow smarter.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Start Analysis</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features/Description Section */}
        <section id="features" className="py-20 md:py-28 bg-muted/40">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="font-headline text-3xl font-semibold">A Revolution in Agricultural Technology</h2>
              <p className="mt-4 text-muted-foreground">
                AgriVisionAI is a comprehensive, cloud-native web application designed to provide intelligent yield analysis and forecasting for tomato farmers. It leverages a modern tech stack—Next.js, Firebase, and Google's Gemini AI via Genkit—to deliver a seamless user experience, from image upload to actionable insights.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="rounded-lg border bg-card p-6 text-center shadow-sm">
                    {feature.icon}
                    <h3 className="mt-4 font-headline text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
                 <Leaf className="h-5 w-5 text-primary" />
                <p className="text-center text-sm text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} AgriVisionAI. All Rights Reserved.
                </p>
            </div>
           <p className="text-center text-sm text-muted-foreground"></p>
        </div>
      </footer>
    </div>
  );
}
