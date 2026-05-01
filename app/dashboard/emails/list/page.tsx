"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Plus, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ TYPESCRIPT INTERFACE
interface EmailDraft {
  id: string;
  email_type: string;
  subject: string;
  body: string;
}

export default function EmailList() {
  const [emails, setEmails] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // ✅ STATE FOR READ MORE / EXPAND
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ✅ MEMOIZED FETCH WITH CACHE BUSTING
  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/emails/${user.id}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      
      if (!res.ok) throw new Error("Failed to fetch emails");
      
      const data: EmailDraft[] = await res.json();
      setEmails(data);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // ✅ OPTIMISTIC DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    
    // Remove from UI instantly
    setEmails((prev) => prev.filter((e) => e.id !== id));
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/${id}`, { 
        method: "DELETE" 
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (error) {
      console.error("Error deleting email:", error);
      alert("Failed to delete draft.");
      fetchEmails(); // Rollback if failed
    }
  };

  // ✅ IMPROVED COPY UX
  const handleCopy = async (id: string, subject: string, body: string) => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // ✅ TOGGLE EXPAND
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Email Drafts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Saved email templates and follow-ups.
          </p>
        </div>

        <Link href="/dashboard/emails">
          <Button className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            New Email
          </Button>
        </Link>
      </div>

      {/* Loading State (Skeletons instead of text) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-24 dark:bg-slate-800" />
                    <Skeleton className="h-5 w-3/4 dark:bg-slate-800" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md dark:bg-slate-800 shrink-0" />
                </div>
                <Skeleton className="h-20 w-full dark:bg-slate-800" />
                <Skeleton className="h-11 w-full rounded-xl dark:bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && emails.length === 0 && (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl shadow-none">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <Mail className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No email drafts yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">
              Use the AI generator to create high-converting outreach, follow-up, and pitch emails.
            </p>

            <Link href="/dashboard/emails">
              <Button className="h-11 px-6 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Create First Email
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Emails Grid */}
      {!loading && emails.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {emails.map((email) => {
            const isExpanded = expandedIds.has(email.id);
            // Threshold to show the "Read more" button (roughly 4 lines worth of chars)
            const isLongText = email.body.length > 180;

            return (
              <Card
                key={email.id}
                className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all duration-200 group overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col flex-1">

                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <span className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-2">
                        {email.email_type}
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2" title={email.subject}>
                        {email.subject}
                      </h3>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete draft"
                      className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(email.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  {/* Body Snippet */}
                  <div className="flex-1 mb-5 flex flex-col items-start">
                    <p 
                      className={`text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed transition-all duration-300 ${
                        isExpanded ? "" : "line-clamp-4"
                      }`}
                    >
                      {email.body}
                    </p>
                    
                    {/* Read More / Show Less Button */}
                    {isLongText && (
                      <button
                        onClick={() => toggleExpand(email.id)}
                        className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors focus:outline-none"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
                        ) : (
                          <>Read more <ChevronDown className="ml-1 h-3 w-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <Button
                    variant="outline"
                    className={`w-full h-11 rounded-xl transition-colors ${
                      copiedId === email.id 
                        ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-50 hover:text-green-600 dark:border-green-500/50 dark:text-green-400 dark:bg-green-950/30"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => handleCopy(email.id, email.subject, email.body)}
                  >
                    {copiedId === email.id ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Content
                      </>
                    )}
                  </Button>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}