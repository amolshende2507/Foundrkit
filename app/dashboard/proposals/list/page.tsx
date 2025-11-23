"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

            // Fetch from our Python Backend
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
        // Refresh list locally to avoid full reload
        setProposals(proposals.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Proposals</h1>
                    <p className="text-slate-600">Manage your drafts and sent documents.</p>
                </div>
                <Link href="/dashboard/proposals">
                    <Button><Plus className="mr-2 h-4 w-4" /> New Proposal</Button>
                </Link>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {proposals.length === 0 && (
                        <p className="text-slate-500">No proposals found. Create your first one!</p>
                    )}

                    {proposals.map((prop) => (
                        <Card key={prop.id} className="hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{prop.client_name}</CardTitle>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${prop.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {prop.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-slate-500 mb-4">
                                    Created: {new Date(prop.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                    <Link href={`/dashboard/proposals/${prop.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full text-sm">View / PDF</Button>
                                    </Link>
                                    <Button variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(prop.id)}>
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