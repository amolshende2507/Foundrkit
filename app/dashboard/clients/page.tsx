"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, Briefcase, Trash2, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ TYPESCRIPT INTERFACE
interface Client {
  id: string;
  name: string;
  email: string;
  industry: string;
  notes: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", email: "", industry: "", notes: "" });

  // ✅ CACHE BUSTING ADDED
  const fetchClients = useCallback(async (uid: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${uid}?t=${Date.now()}`, 
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data: Client[] = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchClients(user.id);
      }
    });
  }, [fetchClients]);

  // ✅ FORM SUBMISSION ENHANCED
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload on enter key
    if (!userId || !form.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...form }),
      });
      
      if (!res.ok) throw new Error("Failed to add client");
      
      setIsOpen(false);
      setForm({ name: "", email: "", industry: "", notes: "" });
      await fetchClients(userId);
    } catch (error) {
      console.error("Error adding client:", error);
      alert("Failed to add client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    
    // Optimistic UI Removal
    setClients(prev => prev.filter(c => c.id !== id)); 
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, { 
        method: "DELETE" 
      });
      if (!res.ok) throw new Error("Failed to delete client");
    } catch (error) {
      console.error("Error deleting client:", error);
      // Restore if failed
      if (userId) fetchClients(userId); 
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Client CRM</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your business relationships</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 w-full sm:w-64 rounded-xl bg-white dark:bg-slate-900" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200">
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-slate-100">New Client</DialogTitle>
              </DialogHeader>
              
              {/* WRAPPED IN A FORM TAG FOR "ENTER" KEY SUPPORT */}
              <form onSubmit={handleAddClient} className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name"
                    required
                    placeholder="e.g. Acme Corp"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="contact@acmecorp.com"
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="industry">Industry</Label>
                  <Input 
                    id="industry"
                    placeholder="e.g. E-commerce"
                    value={form.industry} 
                    onChange={e => setForm({...form, industry: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes</Label>
                  <Input 
                    id="notes"
                    placeholder="Key details..."
                    value={form.notes} 
                    onChange={e => setForm({...form, notes: e.target.value})} 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.name.trim()} 
                  className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 rounded-2xl dark:bg-slate-800" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length === 0 && (
            <Card className="col-span-full py-16 text-center border-dashed border-2 shadow-none bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-center mb-3 text-slate-400">
                <User size={40} />
              </div>
              <p className="text-slate-500 font-medium">
                {search ? "No clients match your search." : "No clients found. Add your first one!"}
              </p>
            </Card>
          )}
          
          {filteredClients.map((client) => (
            <Card key={client.id} className="group hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <User size={18}/>
                  </div>
                  <CardTitle className="text-base truncate max-w-[150px] sm:max-w-[180px]" title={client.name}>
                    {client.name}
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Delete client"
                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" 
                  onClick={() => handleDelete(client.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardContent className="text-sm text-slate-500 dark:text-slate-400 space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="shrink-0" /> 
                  <span className="truncate">{client.industry || "General"}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="shrink-0" /> 
                    <span className="truncate" title={client.email}>{client.email}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl italic text-xs leading-relaxed line-clamp-2" title={client.notes}>
                    "{client.notes}"
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