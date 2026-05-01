"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { 
    UserCircle, Share2, Lightbulb, Mail, BookOpen, Loader2, 
    Copy, Check, Sparkles, Search, Briefcase, Swords 
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   TOOLS DEFINITION                         */
/* -------------------------------------------------------------------------- */
const TOOLS = [
    { id: "bio-generator", title: "Bio Optimizer", desc: "Punchy bios for social.", icon: <UserCircle className="w-8 h-8 text-blue-500" />, inputs: [{ name: "role", label: "Title", placeholder: "Solo Founder..." }, { name: "skills", label: "Wins", placeholder: "Ex-Google..." }, { name: "tone", label: "Tone", placeholder: "Witty, professional..." }] },
    { id: "social-post", title: "Post Creator", desc: "Scroll-stopping content.", icon: <Share2 className="w-8 h-8 text-pink-500" />, inputs: [{ name: "platform", label: "Platform", placeholder: "LinkedIn" }, { name: "topic", label: "Topic", placeholder: "Topic...", type: "textarea" }, { name: "audience", label: "Audience", placeholder: "Founders" }, { name: "tone", label: "Tone", placeholder: "Bold" }] },
    { id: "idea-validator", title: "Idea Roast", desc: "Brutal VC feedback.", icon: <Lightbulb className="w-8 h-8 text-yellow-500" />, inputs: [{ name: "idea", label: "Startup Idea", placeholder: "Uber for...", type: "textarea" }] },
    { id: "cold-email", title: "Cold Email Fixer", desc: "Boost reply rates.", icon: <Mail className="w-8 h-8 text-purple-500" />, inputs: [{ name: "draft", label: "Draft", placeholder: "Hey...", type: "textarea" }] },
    { id: "eli5", title: "Explain Like I'm 5", desc: "Make complex simple.", icon: <BookOpen className="w-8 h-8 text-green-500" />, inputs: [{ name: "concept", label: "Concept", placeholder: "SEO, Quantum..." }] },
    { id: "seo-keywords", title: "SEO Keyword Planner", desc: "Google ranking keywords.", icon: <Search className="w-8 h-8 text-indigo-500" />, inputs: [{ name: "topic", label: "Topic", placeholder: "AI Copy" }, { name: "audience", label: "Audience", placeholder: "Agencies" }] },
    { id: "job-description", title: "Hiring Assistant", desc: "Generate professional JDs.", icon: <Briefcase className="w-8 h-8 text-orange-500" />, inputs: [{ name: "role", label: "Title", placeholder: "Dev" }, { name: "vibe", label: "Culture", placeholder: "Remote" }, { name: "tasks", label: "Tasks", placeholder: "Build UI...", type: "textarea" }] },
    { id: "competitor-swot", title: "Competitor Spy", desc: "SWOT analysis.", icon: <Swords className="w-8 h-8 text-red-500" />, inputs: [{ name: "competitor", label: "Competitor URL", placeholder: "google.com" }, { name: "my_company", label: "Your Company", placeholder: "FoundrKit" }] },
];

export default function ToolsPage() {
    const [activeTool, setActiveTool] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const openTool = (tool: any) => {
        setActiveTool(tool);
        setFormData({});
        setResult("");
    };

    const handleRunTool = async () => {
        if (!activeTool) return;
        setLoading(true);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user?.id || "guest",
                    tool_id: activeTool.id,
                    inputs: formData,
                }),
            });

            if (!res.ok) throw new Error("API request failed");
            
            const data = await res.json();
            setResult(data.result || "No response received.");
            
            // Wait for render, then scroll
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (err) {
            console.error(err);
            alert("Failed to run AI tool.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Tool Collection</h1>
                <p className="text-slate-500 mt-2">High-leverage micro-tools for founders.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {TOOLS.map((tool) => (
                    <Card
                        key={tool.id}
                        onClick={() => openTool(tool)}
                        className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-lg"
                    >
                        <CardHeader className="flex flex-row items-center gap-4 p-6">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                                {tool.icon}
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg">{tool.title}</CardTitle>
                                <CardDescription className="text-sm">{tool.desc}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Sheet open={!!activeTool} onOpenChange={() => setActiveTool(null)}>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0 dark:bg-slate-950">
                    {activeTool && (
                        <div className="flex h-full flex-col">
                            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-5">
                                <SheetTitle className="text-xl font-semibold">{activeTool.title}</SheetTitle>
                                <SheetDescription>{activeTool.desc}</SheetDescription>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                {activeTool.inputs.map((input: any) => (
                                    <div key={input.name} className="space-y-2">
                                        <Label className="text-sm font-medium">{input.label}</Label>
                                        {input.type === "textarea" ? (
                                            <Textarea 
                                                placeholder={input.placeholder} 
                                                className="min-h-[120px]"
                                                onChange={(e) => setFormData(p => ({...p, [input.name]: e.target.value}))}
                                            />
                                        ) : (
                                            <Input 
                                                placeholder={input.placeholder} 
                                                className="h-11"
                                                onChange={(e) => setFormData(p => ({...p, [input.name]: e.target.value}))}
                                            />
                                        )}
                                    </div>
                                ))}

                                {result && (
                                    <div ref={resultRef} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-slate-500">AI Output</span>
                                            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{result}</div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-950">
                                <Button onClick={handleRunTool} disabled={loading} className="w-full h-12">
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Run Tool"}
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}