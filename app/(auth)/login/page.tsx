"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Mail } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  // ✅ EMAIL + PASSWORD AUTH
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationSent(false);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login")) {
            throw new Error(
              "Account not found or password incorrect. Please Sign Up if you are new."
            );
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error(
              "Please verify your email address before logging in."
            );
          } else {
            throw error;
          }
        }

        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });

        if (error) throw error;

        setVerificationSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: GOOGLE OAUTH LOGIN
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // 1. Get the base URL automatically
      // If on Vercel, use that URL. If local, use localhost.
      const origin = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 2. Point to the route inside (auth)/callback/route.ts
          // Since (auth) is a group, the URL is just /callback
          redirectTo: `${origin}/callback`, 
        },
      });

      if (error) throw error;
    } catch (error) {
      alert("Error logging in with Google");
      console.error(error);
      setIsLoading(false);
    }
  };

  // ✅ EMAIL VERIFICATION SCREEN
  if (verificationSent) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Check your inbox
          </h1>
          <p className="text-slate-600">
            We sent a verification link to <strong>{email}</strong>.
            <br />
            Please click the link to activate your HQ.
          </p>
          <Button
            variant="outline"
            onClick={() => setVerificationSent(false)}
            className="mt-4"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // ✅ MAIN AUTH UI
  return (
    <div className="w-full h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden">
      
      {/* LEFT SIDE */}
      <div className="hidden md:flex flex-col justify-between bg-slate-900 p-10 text-white relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover opacity-25 backdrop-blur-sm"></div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            FoundrKit
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] border border-slate-100">

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-slate-500">
              {isLogin
                ? "Enter your email to sign in to your HQ."
                : "Enter your email to create your HQ."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">
                {error}
              </p>
            )}

            <Button
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white tracking-wide"
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Button */}
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="px-8 text-center text-sm text-slate-500">
            {isLogin
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-slate-900 hover:underline underline-offset-4"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}