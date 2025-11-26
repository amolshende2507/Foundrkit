"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, TrendingUp, CheckSquare, Activity } from "lucide-react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export default function Dashboard() {
  const [userName, setUserName] = useState("Founder");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name?.split(" ")[0] || "Founder");

        const res = await fetch(`http://localhost:8000/dashboard/stats/${user.id}`);
        const data = await res.json();
        setStats(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // ✅ Show Skeleton while loading
  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {userName}.
          </h1>
          <p className="text-slate-600 mt-2">
            Here is what is happening in your business today.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Proposals</span>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats?.proposal_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Clients</span>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats?.client_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Tasks</span>
            <div className="text-3xl font-bold text-orange-600 mt-2">{stats?.active_tasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Productivity</span>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats?.productivity_score}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <Link href="/dashboard/proposals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">New Proposal</CardTitle>
              <FileText className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-4">Draft a winning proposal for a client.</p>
              <div className="text-sm text-blue-600 font-medium flex items-center">
                Start Draft <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <Link href="/dashboard/chat">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Strategy Chat</CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-4">Ask your AI Co-Founder for advice.</p>
              <div className="text-sm text-purple-600 font-medium flex items-center">
                Start Chat <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <Link href="/dashboard/tasks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Task Board</CardTitle>
              <CheckSquare className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-4">Manage your to-do list.</p>
              <div className="text-sm text-green-600 font-medium flex items-center">
                View Board <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_proposals.map((p: any, i: number) => (
                <div key={i} className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created proposal for {p.client_name}</p>
                    <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {stats?.recent_tasks.map((t: any, i: number) => (
                <div key={i} className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <CheckSquare size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed: {t.title}</p>
                    <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {stats?.recent_proposals.length === 0 && stats?.recent_tasks.length === 0 && (
                <p className="text-sm text-slate-400">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Card */}
        <Card className="bg-slate-900 text-white flex flex-col justify-center items-center text-center p-6">
          <TrendingUp size={48} className="text-green-400 mb-4" />
          <div className="text-5xl font-bold mb-2">{stats?.productivity_score}%</div>
          <p className="text-slate-400 text-sm">Task Completion Rate</p>
          <div className="mt-6 w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats?.productivity_score || 0}%` }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
