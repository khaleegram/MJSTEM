
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/ui/icons';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, signInWithGoogle, sendPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [resetEmail, setResetEmail] = useState('');


  useEffect(() => {
    const fetchLogo = async () => {
        setLoadingLogo(true);
        try {
            const docRef = doc(db, 'settings', 'branding');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().logoUrl) {
                setLogoUrl(docSnap.data().logoUrl);
            }
        } catch (error) {
            console.error("Could not fetch logo:", error);
        } finally {
            setLoadingLogo(false);
        }
    };
    fetchLogo();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const user = await login(values.email, values.password);
      if (user && !user.emailVerified) {
         toast({
            title: 'Email Not Verified',
            description: "Please check your inbox and verify your email address to log in.",
            variant: 'destructive',
         });
         setIsLoading(false);
         return;
      }
      toast({
        title: 'Login Successful!',
        description: "You've been successfully logged in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
        await signInWithGoogle();
        toast({
            title: 'Login Successful!',
            description: "You've been successfully logged in with Google.",
        });
        router.push('/dashboard');
    } catch (error: any) {
         toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!resetEmail) {
      toast({ title: 'Email required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    try {
      await sendPasswordReset(resetEmail);
      toast({ title: 'Password Reset Email Sent', description: 'If an account exists, an email will be sent with instructions.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
       <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            {loadingLogo ? (
                <Skeleton className="h-10 w-10 mx-auto mb-2" />
            ) : logoUrl ? (
                <Image src={logoUrl} alt="Journal Logo" width={40} height={40} className="object-contain mx-auto mb-2" />
            ) : (
                <Icons.logo className="h-10 w-10 text-primary mx-auto mb-2" />
            )}
            <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
            <CardDescription>
                Enter your credentials to access your account.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
               {isGoogleLoading ? 'Signing in...' : 'Sign In with Google'}
            </Button>
            <div className="my-4 flex items-center">
                <Separator className="flex-1" />
                <span className="mx-4 text-xs uppercase text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                    <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="link" type="button" className="p-0 h-auto text-xs">Forgot Password?</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                              <AlertDialogDescription>
                                Enter your email address and we will send you a link to reset your password.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handlePasswordReset}>Send Reset Link</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Signing In...' : 'Sign In with Email'}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground flex-col gap-2">
            <p>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Sign Up
                </Link>
            </p>
             <Link href="/" className="text-xs hover:underline">
                Back to Homepage
             </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
