"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, Briefcase, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch Clients
  async function fetchClients() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${user.id}`);
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  // Add Client
  const handleAddClient = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch("${process.env.NEXT_PUBLIC_API_URL}/clients/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, name, email, industry, notes }),
    });

    setIsOpen(false);
    setName("");
    setEmail("");
    setIndustry("");
    setNotes("");
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, { method: "DELETE" });
    fetchClients();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Client CRM
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage and organize your client relationships.
          </p>
        </div>

        {/* Add Client Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl p-0 overflow-hidden dark:bg-slate-900 dark:text-slate-100 border dark:border-slate-700">

            <DialogHeader className="p-6 border-b dark:border-slate-700">
              <DialogTitle className="text-lg font-semibold">
                Add New Client
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {/* Client Name */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Client Name
                </Label>
                <Input
                  placeholder="Company or person name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Email
                </Label>
                <Input
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Industry
                </Label>
                <Input
                  placeholder="Technology, Healthcare, Finance…"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notes (AI Context)
                </Label>
                <Input
                  placeholder="Key relationship details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              <Button
                className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 mt-4 transition"
                onClick={handleAddClient}
              >
                Save Client
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skeleton Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[160px] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 
              bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full dark:bg-slate-800" />
                <Skeleton className="h-4 w-[140px] dark:bg-slate-800" />
              </div>
              <Skeleton className="h-4 w-full dark:bg-slate-800" />
              <Skeleton className="h-4 w-[110px] dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {clients.length === 0 && (
            <Card className="col-span-full border-dashed border-2 border-slate-300 dark:border-slate-700 
            bg-white dark:bg-slate-900">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <User className="h-10 w-10 text-slate-300 dark:text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  No clients added
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Add your first client to start managing relationships.
                </p>
              </CardContent>
            </Card>
          )}

          {clients.map((client) => (
            <Card
              key={client.id}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all 
              bg-white dark:bg-slate-900"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {client.name}
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl"
                  onClick={() => handleDelete(client.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="dark:text-slate-400" />
                    {client.industry || "General"}
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="dark:text-slate-400" />
                      {client.email}
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 
                  p-3 rounded-xl italic line-clamp-2">
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
