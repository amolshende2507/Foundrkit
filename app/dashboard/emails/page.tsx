"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Loader2,
  Mail,
  Copy,
  Check,
  Save
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmailGenerator() {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const router = useRouter();

  // Form Inputs
  const [selectedClientName, setSelectedClientName] = useState("");
  const [emailType, setEmailType] = useState("Follow Up");
  const [context, setContext] = useState("");

  // Output
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Clients
  useEffect(() => {
    async function fetchClients() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${user.id}`);
      const data = await res.json();
      setClients(data);
    }
    fetchClients();
  }, []);

  // Generate Email
  const handleGenerate = async () => {
    if (!selectedClientName) {
      alert("Please select a client.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          client_name: selectedClientName,
          email_type: emailType,
          context: context || "General context"
        })
      });

      const data = await response.json();
      setResult(JSON.parse(data));

    } catch {
      alert("Error generating email");
    } finally {
      setLoading(false);
    }
  };

  // Copy
  const handleCopy = () => {
    if (!result) return;
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open in mail app
  const handleOpenMail = () => {
    if (!result) return;
    window.location.href = `mailto:?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
  };

  // Save Email
  const handleSave = async () => {
    if (!result) return;
    setSaveLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/emails/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        client_name: selectedClientName,
        subject: result.subject,
        body: result.body,
        email_type: emailType
      })
    });

    setSaveLoading(false);
    router.push("/dashboard/emails/list");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)] max-w-7xl mx-auto">

      {/* LEFT PANEL */}
      <div className="flex flex-col gap-6">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Email Assistant
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate high-converting emails in seconds.
          </p>
        </div>

        <Card className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold dark:text-slate-100">
              Email Configuration
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">

            {/* Client */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Recipient
              </Label>
              <Select onValueChange={setSelectedClientName}>
                <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name} className="dark:text-slate-200">
                      {client.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Potential Client">Potential Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Type */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email Type
              </Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Proposal Delivery">Proposal Delivery</SelectItem>
                  <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
                  <SelectItem value="Welcome / Onboarding">Client Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Context
              </Label>
              <Textarea
                placeholder="Add optional context..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[120px] rounded-xl resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Generate Email
                </span>
              )}
            </Button>

          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col gap-5">

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Live Preview
        </h2>

        <Card className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-8 h-full flex flex-col dark:text-slate-200">

            {result ? (
              <div className="flex flex-col h-full">

                {/* Subject */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                  <p className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                    Subject
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {result.subject}
                  </h3>
                </div>

                {/* Body */}
                <div className="flex-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {result.body}
                </div>

                {/* Footer Actions */}
                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    {/* Copy */}
                    <Button variant="outline" className="rounded-xl h-11 dark:border-slate-700" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </>
                      )}
                    </Button>

                    {/* Open Mail */}
                    <Button className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenMail}>
                      Open in Mail
                    </Button>

                    {/* Save */}
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 dark:border-slate-700"
                      onClick={handleSave}
                      disabled={saveLoading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveLoading ? "Saving…" : "Save Draft"}
                    </Button>

                  </div>
                </div>
              </div>
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center gap-3">
                <Mail size={48} className="opacity-20" />
                <p className="text-sm">Configure details and generate your first email.</p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
