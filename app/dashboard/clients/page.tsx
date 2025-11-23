"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, Briefcase, Trash2 } from "lucide-react";

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // Modal state

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [industry, setIndustry] = useState("");
    const [notes, setNotes] = useState("");

    // 1. Fetch Clients
    async function fetchClients() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch(`http://localhost:8000/clients/${user.id}`);
        const data = await res.json();
        setClients(data);
        setLoading(false);
    }

    useEffect(() => { fetchClients(); }, []);

    // 2. Add Client Function
    const handleAddClient = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await fetch("http://localhost:8000/clients/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, name, email, industry, notes }),
        });

        setIsOpen(false); // Close modal
        setName(""); setEmail(""); setIndustry(""); setNotes(""); // Reset form
        fetchClients(); // Refresh list
    };
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) return;

        await fetch(`http://localhost:8000/clients/${id}`, { method: "DELETE" });
        fetchClients(); // Refresh the list
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Client CRM</h1>
                    <p className="text-slate-600">Manage your relationships and data.</p>
                </div>

                {/* ADD CLIENT MODAL */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Client Name</Label>
                                <Input placeholder="Company or Person Name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email (Optional)</Label>
                                <Input placeholder="contact@client.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Input placeholder="e.g. Tech, Healthcare" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes (Context for AI)</Label>
                                <Input placeholder="Key details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleAddClient}>Save Client</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* CLIENT LIST */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clients.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-all">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <CardTitle className="text-lg">{client.name}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(client.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-slate-600 mt-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} /> {client.industry || "General"}
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} /> {client.email}
                                    </div>
                                )}
                            </div>
                            {client.notes && (
                                <p className="text-xs text-slate-400 mt-4 italic line-clamp-2">"{client.notes}"</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}