//app\dashboard\emails\list\page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api"; // ✅ Step 1: Import helper
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Plus, Copy } from "lucide-react";
import Link from "next/link";

export default function EmailList() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Step 2: Optimized fetchEmails using apiFetch
  const fetchEmails = async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;

    setLoading(true);
    try {
        const data = await apiFetch(`/emails/${id}`);
        // Ensure data is an array
        setEmails(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch emails:", error);
        setEmails([]);
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
        fetchEmails(uid);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ✅ Step 3: Optimized handleDelete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    
    // Optimistic UI update
    setEmails(prev => prev.filter((e) => e.id !== id));

    try {
        await apiFetch(`/emails/${id}`, { method: "DELETE" });
    } catch (error) {
        alert("Failed to delete draft. Refreshing...");
        fetchEmails();
    }
  };

  const handleCopy = (subject: string, body: string) => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    alert("Email copied to clipboard!");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Email Drafts
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Saved email templates and follow-ups.
          </p>
        </div>

        <Link href="/dashboard/emails">
          <Button className="h-11 px-5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
            <Plus className="mr-2 h-4 w-4" />
            New Email
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading email drafts…</p>
      )}

      {/* Empty State */}
      {!loading && emails.length === 0 && (
        <Card className="border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Mail className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No email drafts
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
              Create your first draft to get started.
            </p>

            <Link href="/dashboard/emails">
              <Button className="h-11 px-5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Create Email
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Emails Grid */}
      {!loading && emails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {emails.map((email) => (
            <Card
              key={email.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md dark:hover:shadow-lg transition-all"
            >
              <CardContent className="p-6">

                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {email.email_type}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-tight">
                      {email.subject}
                    </h3>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl"
                    onClick={() => handleDelete(email.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Body Snippet */}
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-5 whitespace-pre-wrap leading-relaxed">
                  {email.body}
                </p>

                {/* Action Buttons */}
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl dark:border-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => handleCopy(email.subject, email.body)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Content
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}