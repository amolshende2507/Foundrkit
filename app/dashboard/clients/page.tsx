// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Plus, User, Mail, Briefcase, Trash2 } from "lucide-react";

// export default function ClientsPage() {
//     const [clients, setClients] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [isOpen, setIsOpen] = useState(false); // Modal state

//     // Form State
//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [industry, setIndustry] = useState("");
//     const [notes, setNotes] = useState("");

//     // 1. Fetch Clients
//     async function fetchClients() {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) return;
//         const res = await fetch(`http://localhost:8000/clients/${user.id}`);
//         const data = await res.json();
//         setClients(data);
//         setLoading(false);
//     }

//     useEffect(() => { fetchClients(); }, []);

//     // 2. Add Client Function
//     const handleAddClient = async () => {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (!user) return;

//         await fetch("http://localhost:8000/clients/add", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ user_id: user.id, name, email, industry, notes }),
//         });

//         setIsOpen(false); // Close modal
//         setName(""); setEmail(""); setIndustry(""); setNotes(""); // Reset form
//         fetchClients(); // Refresh list
//     };
//     const handleDelete = async (id: string) => {
//         if (!confirm("Are you sure you want to delete this client?")) return;

//         await fetch(`http://localhost:8000/clients/${id}`, { method: "DELETE" });
//         fetchClients(); // Refresh the list
//     };

//     return (
//         <div className="space-y-6">
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-3xl font-bold text-slate-900">Client CRM</h1>
//                     <p className="text-slate-600">Manage your relationships and data.</p>
//                 </div>

//                 {/* ADD CLIENT MODAL */}
//                 <Dialog open={isOpen} onOpenChange={setIsOpen}>
//                     <DialogTrigger asChild>
//                         <Button><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
//                     </DialogTrigger>
//                     <DialogContent>
//                         <DialogHeader>
//                             <DialogTitle>Add New Client</DialogTitle>
//                         </DialogHeader>
//                         <div className="space-y-4 py-4">
//                             <div className="space-y-2">
//                                 <Label>Client Name</Label>
//                                 <Input placeholder="Company or Person Name" value={name} onChange={(e) => setName(e.target.value)} />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Email (Optional)</Label>
//                                 <Input placeholder="contact@client.com" value={email} onChange={(e) => setEmail(e.target.value)} />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Industry</Label>
//                                 <Input placeholder="e.g. Tech, Healthcare" value={industry} onChange={(e) => setIndustry(e.target.value)} />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Notes (Context for AI)</Label>
//                                 <Input placeholder="Key details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
//                             </div>
//                             <Button className="w-full" onClick={handleAddClient}>Save Client</Button>
//                         </div>
//                     </DialogContent>
//                 </Dialog>
//             </div>

//             {/* CLIENT LIST */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {clients.map((client) => (
//                     <Card key={client.id} className="hover:shadow-md transition-all">
//                         <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
//                             <div className="flex items-center gap-2">
//                                 <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
//                                     <User className="h-4 w-4 text-blue-600" />
//                                 </div>
//                                 <CardTitle className="text-lg">{client.name}</CardTitle>
//                             </div>
//                             <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(client.id)}>
//                                 <Trash2 size={16} />
//                             </Button>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-2 text-sm text-slate-600 mt-2">
//                                 <div className="flex items-center gap-2">
//                                     <Briefcase size={14} /> {client.industry || "General"}
//                                 </div>
//                                 {client.email && (
//                                     <div className="flex items-center gap-2">
//                                         <Mail size={14} /> {client.email}
//                                     </div>
//                                 )}
//                             </div>
//                             {client.notes && (
//                                 <p className="text-xs text-slate-400 mt-4 italic line-clamp-2">"{client.notes}"</p>
//                             )}
//                         </CardContent>
//                     </Card>
//                 ))}
//             </div>
//         </div>
//     );
// }


"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  // 1. Fetch Clients
  async function fetchClients() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const res = await fetch(`http://localhost:8000/clients/${user.id}`);
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  // 2. Add Client
  const handleAddClient = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch("http://localhost:8000/clients/add", {
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
    if (!confirm("Are you sure you want to delete this client?")) return;
    await fetch(`http://localhost:8000/clients/${id}`, { method: "DELETE" });
    fetchClients();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Client CRM
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage and organize your client relationships.
          </p>
        </div>

        {/* Add Client Modal */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl p-0 overflow-hidden">

            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-lg font-semibold">
                Add New Client
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Client Name
                </Label>
                <Input
                  placeholder="Company or person name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </Label>
                <Input
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Industry
                </Label>
                <Input
                  placeholder="Technology, Healthcare, Finance…"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-slate-500">
                  Notes (AI Context)
                </Label>
                <Input
                  placeholder="Key relationship details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 mt-4"
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
              className="h-[160px] border border-slate-200 rounded-2xl p-6 space-y-4 bg-white"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-[140px]" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[110px]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {clients.length === 0 && (
            <Card className="col-span-full border-dashed border-2 border-slate-200 bg-white">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <User className="h-10 w-10 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">
                  No clients added
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Add your first client to start managing relationships.
                </p>
              </CardContent>
            </Card>
          )}

          {clients.map((client) => (
            <Card
              key={client.id}
              className="border border-slate-200 rounded-2xl hover:shadow-md transition-all bg-white"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {client.name}
                  </CardTitle>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  onClick={() => handleDelete(client.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} />
                    {client.industry || "General"}
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {client.email}
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl italic line-clamp-2">
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
