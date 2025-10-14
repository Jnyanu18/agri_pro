"use client";

import { Leaf } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '../ui/button';
import { Download, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AgriVisionHeader() {
  
  const handleExport = () => {
    // In a real app, you would collect state from a context or store
    const sessionData = {
      note: "This is mock data as a placeholder for the real application state.",
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrivision_session_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
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
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="mr-2 h-4 w-4" />
              Deploy Tips
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deployment Information</DialogTitle>
              <DialogDescription>
                Instructions for running and deploying the application.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold">Local Development (Next.js)</h3>
                  <code className="block whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs">
                    npm install{"\n"}
                    npm run dev
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold">Docker Build & Run</h3>
                  <code className="block whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs">
                    docker build -t agrivision-ai .{"\n"}
                    docker run -p 3000:3000 agrivision-ai
                  </code>
                </div>
            </div>
          </DialogContent>
        </Dialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
