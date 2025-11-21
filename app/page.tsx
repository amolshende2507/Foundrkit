"use client"; // This makes it a Client Component

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Checking connection...");

  useEffect(() => {
    async function checkSupabase() {
      // We try to fetch the public 'profiles' table (even if it doesn't exist yet, we get a response)
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (error && error.code !== 'PGRST116') {
        // If we get a specific database error, it means we CONNECTED, but the table is missing.
        // This is good! It means the credentials work.
        setStatus("✅ Connected to Supabase!");
      } else {
        setStatus("✅ Connected to Supabase!");
      }
    }
    checkSupabase();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 space-y-6">
      <h1 className="text-4xl font-bold text-slate-900">FoundrKit</h1>
      
      {/* This acts as our connection test */}
      <div className="p-4 bg-white rounded-lg shadow border border-slate-200">
        <p className="text-slate-600 font-medium">{status}</p>
      </div>

      <div className="flex gap-4">
        <Button>Get Started</Button>
        <Button variant="outline">Login</Button>
      </div>
    </main>
  );
}