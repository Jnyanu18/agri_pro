
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoading(false);
        if (user) {
            toast({
                title: 'Registration Successful',
                description: 'Welcome to AgriVisionAI!',
            });
            router.push('/');
        }
    }, (error) => {
        setIsLoading(false);
        const errorCode = (error as any).code;
        let errorMessage = "An unknown error occurred during registration.";
        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please log in.';
        }
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: errorMessage,
        });
    });

    return () => unsubscribe();
  }, [auth, router, toast]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    initiateEmailSignUp(auth, values.email, values.password);
  };

  if (isUserLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Leaf className="h-10 w-10 text-primary" />
          <CardTitle className="font-headline text-2xl">{t('create_account')}</CardTitle>
          <CardDescription>{t('join_to_analyze')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('creating_account') : t('register')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <p>
            {t('already_have_account')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t('login')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
