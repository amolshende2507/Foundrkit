"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus, Trash2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ TYPESCRIPT INTERFACE
interface Proposal {
  id: string;
  client_name: string;
  status: string;
  created_at: string;
}

export default function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ MEMOIZED FETCH WITH CACHE BUSTING
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/proposals/${user.id}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      
      if (!response.ok) throw new Error("Failed to fetch proposals");
      
      const data: Proposal[] = await response.json();
      setProposals(data);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // ✅ OPTIMISTIC DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    
    // Remove from UI instantly
    setProposals((prev) => prev.filter((p) => p.id !== id));
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/${id}`, { 
        method: "DELETE" 
      });
      if (!res.ok) throw new Error("Failed to delete proposal");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      alert("Failed to delete proposal.");
      fetchProposals(); // Rollback if failed
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Proposals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all client proposals.
          </p>
        </div>

        <Link href="/dashboard/proposals">
          <Button className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 
            text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        </Link>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 dark:bg-slate-800" />
                    <Skeleton className="h-3 w-24 dark:bg-slate-800" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg dark:bg-slate-800" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl dark:bg-slate-800" />
                  <Skeleton className="h-10 w-10 rounded-xl dark:bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && proposals.length === 0 && (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl shadow-none">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No proposals yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">
              Create your first AI-powered proposal to land more clients.
            </p>
            <Link href="/dashboard/proposals">
              <Button className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all">
                Create First Proposal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* PROPOSAL GRID */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {proposals.map((prop) => (
            <Card
              key={prop.id}
              className="group border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:shadow-md dark:hover:shadow-slate-800/20 transition-all duration-200"
            >
              <CardContent className="p-5 flex flex-col h-full">

                {/* HEADER */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-1" title={prop.client_name}>
                      {prop.client_name}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(prop.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${
                      prop.status?.toLowerCase() === "draft"
                        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/20"
                    }`}
                  >
                    {prop.status || "Draft"}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 mt-auto">
                  <Link href={`/dashboard/proposals/${prop.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-sm border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      View Proposal
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete proposal"
                    onClick={() => handleDelete(prop.id)}
                    className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}