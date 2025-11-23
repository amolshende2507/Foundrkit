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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-100px)]">

            {/* LEFT: Configuration */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Email Assistant</h1>
                    <p className="text-slate-600">Draft perfect communication in seconds.</p>
                </div>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Email Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Recipient (Client)</Label>
                            <Select onValueChange={setSelectedClientName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select from CRM..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                    <SelectItem value="Potential Client">Generic / New Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Email Type</Label>
                            <Select value={emailType} onValueChange={setEmailType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cold Outreach">Cold Outreach (Sales)</SelectItem>
                                    <SelectItem value="Follow Up">Follow Up (No Reply)</SelectItem>
                                    <SelectItem value="Proposal Delivery">Sending a Proposal</SelectItem>
                                    <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
                                    <SelectItem value="Welcome / Onboarding">Welcome New Client</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Specific Context (Optional)</Label>
                            <Textarea
                                placeholder="e.g. They mentioned they are busy until Monday..."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                            />
                        </div>

                        <Button onClick={handleGenerate} disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
                            Write Email
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: Preview */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-slate-900 h-[28px]">Preview</h2>
                <Card className="flex-1 bg-slate-50 border-slate-200">
                    <CardContent className="p-6 h-full flex flex-col">
                        {result ? (
                            <div className="flex flex-col h-full gap-4">
                                <div className="border-b pb-4">
                                    <span className="text-slate-500 text-sm font-medium uppercase">Subject:</span>
                                    <p className="font-semibold text-slate-900 text-lg">{result.subject}</p>
                                </div>
                                <div className="flex-1 whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
                                    {result.body}
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button variant="outline" className="flex-1" onClick={handleCopy}>
                                        {copied ? <><Check className="mr-2 h-4 w-4 text-green-600" /> Copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy Text</>}
                                    </Button>
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleOpenMail}>
                                        Open in Gmail/Mail
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={handleSave} disabled={saveLoading}>
                                        <Save className="mr-2 h-4 w-4" /> {saveLoading ? "Saving..." : "Save Draft"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Mail size={48} className="mb-4 opacity-20" />
                                <p>Configure settings to generate a draft.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}