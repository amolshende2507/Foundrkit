//app\dashboard\clients\page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api"; // ✅ Step 1: Import the helper
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, Briefcase, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", email: "", industry: "", notes: "" });

  // ✅ Step 2: Use apiFetch for fetching data (Handles JWT and URL automatically)
  const fetchClients = async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    try {
        const data = await apiFetch(`/clients/${id}`);
        setClients(Array.isArray(data) ? data : []);
        console.log("Fetched clients:", data);
    } catch (error) {
        console.error("Failed to fetch clients:", error);
        setClients([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      if (uid) {
        fetchClients(uid);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ✅ Step 3: Use apiFetch for adding a client
  const handleAddClient = async () => {
    if (!userId || !form.name) return;

    try {
        await apiFetch(`/clients/add`, {
            method: "POST",
            body: JSON.stringify({
                user_id: userId,
                ...form,
            }),
        });

        setIsOpen(false);
        setForm({ name: "", email: "", industry: "", notes: "" });
        fetchClients(); // Refresh list using cached userId
    } catch (error) {
        alert("Failed to save client.");
    }
  };

  // ✅ Step 4: Use apiFetch for deleting
  const handleDelete = async (id: string) => {
    if (!confirm("Delete client?")) return;
    
    setClients(prev => prev.filter(c => c.id !== id)); // Optimistic UI update

    try {
        await apiFetch(`/clients/${id}`, { method: "DELETE" });
    } catch (error) {
        alert("Failed to delete client. Refreshing...");
        fetchClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!userId && !loading) {
    return <div className="text-center text-slate-400 mt-20">Not authenticated</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client CRM</h1>
          <p className="text-slate-500 text-sm">Manage your business relationships</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 w-64 rounded-xl" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl px-5"><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="space-y-1"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} /></div>
                <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
                <Button className="w-full h-11 mt-2" onClick={handleAddClient}>Save Client</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredClients.length === 0 && (
            <Card className="col-span-full py-12 text-center text-slate-400">
                No clients found.
            </Card>
          )}
          {filteredClients.map((client) => (
            <Card key={client.id} className="group hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <User size={18}/>
                  </div>
                  <CardTitle className="text-base">{client.name}</CardTitle>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-red-500" 
                    onClick={() => handleDelete(client.id)}
                >
                    <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardContent className="text-sm text-slate-500 space-y-1">
                <div className="flex items-center gap-2"><Briefcase size={14} /> {client.industry || "General"}</div>
                {client.email && <div className="flex items-center gap-2"><Mail size={14} /> {client.email}</div>}
                {client.notes && (
                    <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg italic text-xs line-clamp-2">
                        {client.notes}
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}