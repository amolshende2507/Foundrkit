"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, Sparkles, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [userName, setUserName] = useState("Founder");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the name from metadata or default to 'Founder'
        const name = user.user_metadata?.full_name || "Founder";
        setUserName(name.split(" ")[0]); // Just get first name
      }
      setLoading(false);
    }
    getUser();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {loading ? "Loading..." : `Welcome back, ${userName}.`}
          </h1>
          <p className="text-slate-600 mt-2">
            Your AI Co-Founder is ready. What are we building today?
          </p>
        </div>
        <div className="hidden md:block">
           <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-600"></span>
              System Online
            </span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Action 1: Create Proposal */}
        <Card className="hover:shadow-lg transition-all border-slate-200 cursor-pointer group">
          <Link href="/dashboard/proposals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                New Proposal
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Generate PDF</div>
              <p className="text-xs text-slate-500">
                Draft a winning proposal for a client in seconds using your brand voice.
              </p>
              <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                Start Draft <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Action 2: Chat with AI */}
        <Card className="hover:shadow-lg transition-all border-slate-200 cursor-pointer group">
          <Link href="/dashboard/chat">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Strategy Chat
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Ask Co-Founder</div>
              <p className="text-xs text-slate-500">
                Brainstorm marketing ideas or pricing strategies with context-aware AI.
              </p>
              <div className="mt-4 flex items-center text-sm text-purple-600 font-medium">
                Start Chat <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Action 3: Settings */}
        <Card className="hover:shadow-lg transition-all border-slate-200 cursor-pointer group">
          <Link href="/dashboard/settings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Brand DNA
              </CardTitle>
              <Sparkles className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Update Context</div>
              <p className="text-xs text-slate-500">
                Teach the AI about your company updates to get better results.
              </p>
              <div className="mt-4 flex items-center text-sm text-amber-600 font-medium">
                Edit Profile <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Analytics / Fake Data Section (To look professional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                            <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Proposal Generated</p>
                            <p className="text-xs text-slate-500">Just now</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Strategy Session</p>
                            <p className="text-xs text-slate-500">2 hours ago</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Brand Profile Updated</p>
                            <p className="text-xs text-slate-500">Yesterday</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white">
            <CardHeader>
                <CardTitle className="text-white">Productivity Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="text-5xl font-bold text-blue-400 mb-2">92%</div>
                <p className="text-slate-400 text-sm">You saved approx. <span className="text-white font-bold">4 hours</span> this week using AI automation.</p>
                <Button variant="secondary" className="mt-6 w-full">View Details</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}