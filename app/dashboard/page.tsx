//app\dashboard\page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  TrendingUp,
  CheckSquare,
  Activity
} from "lucide-react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null); // ✅ Step 1: Add userId state
  const [userName, setUserName] = useState("Founder");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Step 2: Refactored useEffect (Fetch user once + fetch stats)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      setUserId(uid);

      if (uid && user) {
        setUserName(user.user_metadata?.full_name?.split(" ")[0] || "Founder");

        // Fetch dashboard stats using cached UID
        const res = await fetch(`/dashboard/stats/${uid}`);
        const data = await res.json();
        setStats(data);
      }

      setLoading(false);
    };

    init();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
            {userName}, here’s a summary of your business performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/proposals">
            <Button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 text-white rounded-xl px-5">
              Create Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Proposals",
            value: stats?.proposal_count,
            icon: FileText,
            color: "text-blue-600 dark:text-blue-400",
            border: "border-blue-600 dark:border-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "Clients",
            value: stats?.client_count,
            icon: MessageSquare,
            color: "text-purple-600 dark:text-purple-400",
            border: "border-purple-600 dark:border-purple-400",
            bg: "bg-purple-50 dark:bg-purple-950/30",
          },
          {
            label: "Active Tasks",
            value: stats?.active_tasks,
            icon: CheckSquare,
            color: "text-orange-600 dark:text-orange-400",
            border: "border-orange-600 dark:border-orange-400",
            bg: "bg-orange-50 dark:bg-orange-950/30",
          },
          {
            label: "Productivity",
            value: `${stats?.productivity_score}%`,
            icon: TrendingUp,
            color: "text-green-600 dark:text-green-400",
            border: "border-green-600 dark:border-green-400",
            bg: "bg-green-50 dark:bg-green-950/30",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 
                transition-all duration-300 bg-white dark:bg-slate-900/70 backdrop-blur-lg
                border-t-4 ${item.border}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {item.value}
                  </h2>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                  <Icon size={20} className={`${item.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "New Proposal",
            desc: "Draft a winning proposal.",
            href: "/dashboard/proposals",
            icon: FileText,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            title: "Strategy Chat",
            desc: "Talk with your AI Co-Founder.",
            href: "/dashboard/chat",
            icon: MessageSquare,
            color: "text-purple-600 dark:text-purple-400",
          },
          {
            title: "Task Board",
            desc: "Manage your daily mission list.",
            href: "/dashboard/tasks",
            icon: CheckSquare,
            color: "text-green-600 dark:text-green-400",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={i}>
              <Card className="group hover:-translate-y-1 transition-all 
                 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl 
                 border border-slate-200 dark:border-slate-800 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </CardTitle>
                  <Icon className={`h-6 w-6 ${item.color} group-hover:scale-125 transition`} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {item.desc}
                  </p>
                  <div
                    className={`text-sm font-medium ${item.color} flex items-center`}
                  >
                    Continue{" "}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Activity + Productivity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Activity Feed */}
        <Card className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity size={18} /> Recent Activity
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-5 relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

              {stats?.recent_proposals?.map((p: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center z-10">
                    <FileText size={14} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Proposal created for {p.client_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {stats?.recent_tasks?.map((t: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center z-10">
                    <CheckSquare size={14} className="text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Completed {t.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {stats?.recent_proposals?.length === 0 &&
                stats?.recent_tasks?.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    No activity yet.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Card */}
        <Card className="relative overflow-hidden border-0 
          bg-gradient-to-br from-slate-900 via-slate-800 to-black 
          dark:from-slate-900 dark:via-slate-800 dark:to-black 
          text-white p-6 flex flex-col items-center justify-center text-center">
          
          <div className="absolute inset-0 
            bg-gradient-to-br from-green-500/10 to-transparent 
            blur-2xl pointer-events-none" />

          <TrendingUp size={52} className="text-green-400 mb-4 animate-pulse" />

          <div className="text-6xl font-extrabold tracking-tight">
            {stats?.productivity_score}%
          </div>

          <p className="text-slate-400 text-sm mt-2">Task Completion Rate</p>

          <div className="mt-6 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-[1500ms]"
              style={{ width: `${stats?.productivity_score || 0}%` }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}