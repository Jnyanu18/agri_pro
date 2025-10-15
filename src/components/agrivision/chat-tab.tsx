
"use client";

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { runChatAssistant } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { MarketPriceForecastingOutput } from '@/ai/flows/market-price-forecasting';
import type { AppControls, DetectionResult, ForecastResult } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface ChatTabProps {
  appState: {
    controls: AppControls;
    detectionResult: DetectionResult | null;
    forecastResult: ForecastResult | null;
    marketResult: MarketPriceForecastingOutput | null;
  }
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function ChatTab({ appState, chatHistory, setChatHistory }: ChatTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setChatHistory(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    const response = await runChatAssistant({
      query: input,
      detectionResult: appState.detectionResult,
      forecastResult: appState.forecastResult,
      marketResult: appState.marketResult,
    });
    
    setIsLoading(false);
    
    if (response.success && response.data) {
      const newAssistantMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.data.reply };
      setChatHistory(prev => [...prev, newAssistantMessage]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Assistant Error',
        description: response.error,
      });
      setChatHistory(prev => prev.slice(0, -1)); // Remove the user message if API fails
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {chatHistory.length === 0 ? (
             <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center h-full">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
                <h3 className="font-headline text-xl font-semibold">{t('ai_assistant_title')}</h3>
                <p className="text-muted-foreground">{t('ai_assistant_desc')}</p>
            </div>
          ) : (
            chatHistory.map(message => (
              <div key={message.id} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : '')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-md rounded-lg p-3 text-sm',
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {message.content}
                </div>
              </div>
            ))
          )}
           {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-lg p-3 text-sm bg-muted animate-pulse">
                    {t('thinking')}
                </div>
              </div>
            )}
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('ask_about_yield')}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
