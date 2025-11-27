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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`http://localhost:8000/proposals/${user.id}`);
      const data = await response.json();
      setProposals(data);
      setLoading(false);
    }
    fetchProposals();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`http://localhost:8000/proposals/${id}`, { method: "DELETE" });
    setProposals(proposals.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Proposals
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage and track all client proposals.
          </p>
        </div>

        <Link href="/dashboard/proposals">
          <Button className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-sm text-slate-500">Loading proposals…</div>
      )}

      {/* Empty State */}
      {!loading && proposals.length === 0 && (
        <Card className="border border-dashed border-slate-300 bg-white">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">
              No proposals yet
            </h3>
            <p className="text-sm text-slate-500 mt-2 mb-4">
              Create your first proposal to get started.
            </p>
            <Link href="/dashboard/proposals">
              <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl">
                Create Proposal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Proposal Grid */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {proposals.map((prop) => (
            <Card
              key={prop.id}
              className="border border-slate-200 rounded-2xl hover:shadow-md transition-all bg-white"
            >
              <CardContent className="p-5">

                {/* Top Meta */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">
                      {prop.client_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Created {new Date(prop.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-lg 
                    ${prop.status === "Draft"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {prop.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/proposals/${prop.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-sm"
                    >
                      View Proposal
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(prop.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
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
