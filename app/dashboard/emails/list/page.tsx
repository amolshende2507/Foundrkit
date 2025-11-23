"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Plus, Copy } from "lucide-react";
import Link from "next/link";

export default function EmailList() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmails() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`http://localhost:8000/emails/${user.id}`);
      const data = await res.json();
      setEmails(data);
      setLoading(false);
    }
    fetchEmails();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this draft?")) return;
    await fetch(`http://localhost:8000/emails/${id}`, { method: "DELETE" });
    setEmails(emails.filter(e => e.id !== id));
  };

  const handleCopy = (subject: string, body: string) => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Email Drafts</h1>
            <p className="text-slate-600">Saved templates and follow-ups.</p>
        </div>
        <Link href="/dashboard/emails">
            <Button><Plus className="mr-2 h-4 w-4" /> New Email</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emails.map((email) => (
          <Card key={email.id} className="hover:shadow-md transition-all">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{email.email_type}</span>
                        <CardTitle className="text-lg mt-1">{email.subject}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(email.id)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 font-sans whitespace-pre-wrap">
                    {email.body}
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleCopy(email.subject, email.body)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Text
                    </Button>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}