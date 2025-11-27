"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
export default function EmailGenerator() {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const router = useRouter();
    const [saveLoading, setSaveLoading] = useState(false);

    // Inputs
    const [selectedClientName, setSelectedClientName] = useState("");
    const [emailType, setEmailType] = useState("Follow Up");
    const [context, setContext] = useState("");

    // Output
    const [result, setResult] = useState<{ subject: string, body: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const handleSave = async () => {
        if (!result) return;
        setSaveLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        await fetch("http://localhost:8000/emails/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user?.id,
                client_name: selectedClientName,
                subject: result.subject,
                body: result.body,
                email_type: emailType
            })
        });
        setSaveLoading(false);
        alert("Email saved to drafts!");
        router.push("/dashboard/emails/list"); // We build this next
    };

    // 1. Fetch Clients
    useEffect(() => {
        async function fetchClients() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const res = await fetch(`http://localhost:8000/clients/${user.id}`);
            const data = await res.json();
            setClients(data);
        }
        fetchClients();
    }, []);

    // 2. Generate Logic
    const handleGenerate = async () => {
        if (!selectedClientName) {
            alert("Please select a client (or type a name).");
            return;
        }
        setLoading(true);
        setResult(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const response = await fetch("http://localhost:8000/generate-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    client_name: selectedClientName,
                    email_type: emailType,
                    context: context || "Standard outreach"
                })
            });

            const data = await response.json();
            setResult(JSON.parse(data)); // Parse the JSON string from Python

        } catch (error) {
            alert("Error generating email");
        } finally {
            setLoading(false);
        }
    };

    // 3. Copy to Clipboard
    const handleCopy = () => {
        if (!result) return;
        const fullText = `Subject: ${result.subject}\n\n${result.body}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 4. Open in Default Mail App
    const handleOpenMail = () => {
        if (!result) return;
        window.location.href = `mailto:?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)] max-w-7xl mx-auto">

            {/* LEFT: Configuration Panel */}
            <div className="flex flex-col gap-5">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Email Assistant
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Generate high-converting client emails in seconds.
                    </p>
                </div>

                <Card className="flex-1 border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <CardHeader className="border-b">
                        <CardTitle className="text-base font-semibold">
                            Email Configuration
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">

                        {/* Client Select */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-500">
                                Recipient
                            </Label>
                            <Select onValueChange={setSelectedClientName}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Select from CRM" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="Potential Client">
                                        New / Potential Client
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Email Type */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-slate-500">
                                Email Type
                            </Label>
                            <Select value={emailType} onValueChange={setEmailType}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                            <Label className="text-xs uppercase tracking-wider text-slate-500">
                                Context
                            </Label>
                            <Textarea
                                placeholder="Add optional context or conversation history..."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="min-h-[120px] rounded-xl resize-none"
                            />
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    Generating Email…
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Generate Email
                                </div>
                            )}
                        </Button>

                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: Preview Panel */}
            <div className="flex flex-col gap-5">

                <h2 className="text-lg font-semibold text-slate-900">
                    Live Preview
                </h2>

                <Card className="flex-1 border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-8 h-full flex flex-col">

                        {result ? (
                            <div className="flex flex-col h-full">

                                {/* Subject */}
                                <div className="border-b pb-4 mb-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Subject
                                    </p>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                                        {result.subject}
                                    </h3>
                                </div>

                                {/* Body */}
                                <div className="flex-1 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed font-sans">
                                    {result.body}
                                </div>

                                {/* Actions */}
                                <div className="pt-6 mt-6 border-t flex flex-col gap-3">

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl h-11"
                                            onClick={handleCopy}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700"
                                            onClick={handleOpenMail}
                                        >
                                            Open in Mail
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="rounded-xl h-11"
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
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center gap-3">
                                <Mail size={48} className="opacity-20" />
                                <p className="text-sm">
                                    Configure settings and generate your first email.
                                </p>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>

        </div>
    );

}