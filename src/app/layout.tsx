
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Suspense } from 'react';

// This is now a Client Component, so we can't export metadata directly.
// We can set title dynamically if needed, or in the head tag.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>AgriVisionAI</title>
        <meta name="description" content="A smart tomato yield intelligence platform." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Suspense fallback={<div>Loading...</div>}>
            <I18nextProvider i18n={i18n}>
                <FirebaseClientProvider>
                    {children}
                </FirebaseClientProvider>
                <Toaster />
            </I18nextProvider>
        </Suspense>
      </body>
    </html>
  );
}
