"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowRight, Github } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (user) {
          // CHECK IF ONBOARDING IS NEEDED
          // We check if they have a company name set in brand_settings
          const { data: brand } = await supabase
            .from("brand_settings")
            .select("company_name")
            .eq("user_id", user.id)
            .single();

          if (brand) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding"); // <--- REDIRECT NEW USERS HERE
          }
        }
      
    } else {
      // SIGNUP LOGIC
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert("Account created! You can now log in.");
      setIsLogin(true); // Switch back to login
    }
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

return (
  <div className="w-full h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden">

    {/* LEFT SIDE: Branding / Art */}
    <div className="hidden md:flex flex-col justify-between bg-slate-900 p-10 text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover opacity-25 backdrop-blur-sm"></div>

      <div className="relative z-10 flex items-center gap-2">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">FoundrKit</span>
      </div>

      <div className="relative z-10 space-y-4">
        <blockquote className="text-lg font-medium leading-relaxed">
          "This tool saved me 20 hours a week. It's not just an AI wrapper; it's genuinely like having a co-founder who handles the boring stuff."
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-700"></div>
          <div>
            <div className="font-semibold">Alex Chen</div>
            <div className="text-sm text-slate-400">Solo Founder, TechStart</div>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE: The Form */}
    <div className="flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] border border-slate-100">

        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-slate-500">
            {isLogin ? "Enter your email to sign in to your HQ." : "Enter your email to create your HQ."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
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

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <Button disabled={isLoading} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white tracking-wide">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" type="button" disabled={isLoading} className="w-full">
          <Github className="mr-2 h-4 w-4" /> Github (Demo)
        </Button>

        <p className="px-8 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
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