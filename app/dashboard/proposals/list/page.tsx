//app\dashboard\proposals\list\page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus, Trash2 } from "lucide-react";

interface Proposal {
  id: string;
  client_name: string;
  status: string;
  created_at: string;
}

export default function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/${user.id}`);
      const data = await response.json();
      setProposals(data);
      setLoading(false);
    }
    fetchProposals();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposals/${id}`, { method: "DELETE" });
    setProposals(proposals.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Proposals
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage and track all client proposals.
          </p>
        </div>

        <Link href="/dashboard/proposals">
          <Button className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 
            text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        </Link>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Loading proposals…
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && proposals.length === 0 && (
        <Card className="border border-dashed border-slate-300 dark:border-slate-700 
          bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No proposals yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
              Create your first proposal to get started.
            </p>
            <Link href="/dashboard/proposals">
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 
                text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                Create Proposal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* PROPOSAL GRID */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {proposals.map((prop) => (
            <Card
              key={prop.id}
              className="border border-slate-200 dark:border-slate-800 
                rounded-2xl bg-white dark:bg-slate-900 
                hover:shadow-lg dark:hover:shadow-slate-800/40 
                transition-all"
            >
              <CardContent className="p-5">

                {/* HEADER */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {prop.client_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Created {new Date(prop.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* STATUS BADGE */}
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      prop.status === "Draft"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/proposals/${prop.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-sm 
                        dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View Proposal
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(prop.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 
                      dark:hover:bg-red-900/20 rounded-xl"
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
