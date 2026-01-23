"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
    UserCircle,
    Share2,
    Lightbulb,
    Mail,
    BookOpen,
    Loader2,
    Copy,
    Check,
    Sparkles,
    Search,
    Briefcase,
    Swords,
} from "lucide-react";


/* -------------------------------------------------------------------------- */
/*                                   TOOLS                                    */
/* -------------------------------------------------------------------------- */

const TOOLS = [
    {
        id: "bio-generator",
        title: "Bio Optimizer",
        desc: "Create punchy bios for LinkedIn & Twitter.",
        icon: <UserCircle className="w-8 h-8 text-blue-500" />,
        inputs: [
            { name: "role", label: "Your Role / Title", placeholder: "Solo Founder, Growth Lead…" },
            { name: "skills", label: "Key Wins / Flex", placeholder: "Ex-Google, Built 3 SaaS apps…" },
            { name: "tone", label: "Tone", placeholder: "Professional, witty, humble…" },
        ],
    },
    {
        id: "social-post",
        title: "Post Creator",
        desc: "Generate scroll-stopping social content.",
        icon: <Share2 className="w-8 h-8 text-pink-500" />,
        inputs: [
            { name: "platform", label: "Platform", placeholder: "LinkedIn / Twitter" },
            {
                name: "topic",
                label: "Post Topic",
                placeholder: "Why remote work is harder than people admit…",
                type: "textarea",
            },
            { name: "audience", label: "Audience", placeholder: "Founders, junior devs…" },
            { name: "tone", label: "Tone", placeholder: "Bold, contrarian, concise" },
        ],
    },
    {
        id: "idea-validator",
        title: "Idea Roast",
        desc: "Brutal VC-style feedback on your idea.",
        icon: <Lightbulb className="w-8 h-8 text-yellow-500" />,
        inputs: [
            {
                name: "idea",
                label: "Describe Your Startup Idea",
                placeholder: "Uber for dog walkers but subscription-based…",
                type: "textarea",
            },
        ],
    },
    {
        id: "cold-email",
        title: "Cold Email Fixer",
        desc: "Rewrite emails to boost reply rates.",
        icon: <Mail className="w-8 h-8 text-purple-500" />,
        inputs: [
            {
                name: "draft",
                label: "Your Rough Draft",
                placeholder: "Hey, I wanted to introduce myself…",
                type: "textarea",
            },
        ],
    },
    {
        id: "eli5",
        title: "Explain Like I'm 5",
        desc: "Make complex ideas simple.",
        icon: <BookOpen className="w-8 h-8 text-green-500" />,
        inputs: [
            {
                name: "concept",
                label: "Complex Concept",
                placeholder: "Quantum computing, SEO, CRDTs…",
            },
        ],
    },
    {
        id: "seo-keywords",
        title: "SEO Keyword Planner",
        desc: "Find the best keywords to rank on Google.",
        icon: <Search className="w-8 h-8 text-indigo-500" />,
        inputs: [
            { name: "topic", label: "Business Topic", placeholder: "e.g. AI Copywriting" },
            { name: "audience", label: "Target Customer", placeholder: "e.g. Marketing Agencies" },
        ],
    },
    {
        id: "job-description",
        title: "Hiring Assistant",
        desc: "Generate professional JDs to hire talent.",
        icon: <Briefcase className="w-8 h-8 text-orange-500" />,
        inputs: [
            { name: "role", label: "Job Title", placeholder: "e.g. React Developer" },
            { name: "vibe", label: "Company Culture", placeholder: "e.g. Fast-paced, remote-first" },
            { name: "tasks", label: "Main Tasks", placeholder: "e.g. Build UI components, fix bugs", type: "textarea" },
        ],
    },
    {
        id: "competitor-swot",
        title: "Competitor Spy",
        desc: "Analyze a competitor's weaknesses.",
        icon: <Swords className="w-8 h-8 text-red-500" />,
        inputs: [
            { name: "competitor", label: "Competitor Name/URL", placeholder: "e.g. Competitor.com" },
            { name: "my_company", label: "Your Company", placeholder: "e.g. FoundrKit" },
        ],
    },
];

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function ToolsPage() {
    const [activeTool, setActiveTool] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    /* Reset when tool changes */
    const openTool = (tool: any) => {
        setActiveTool(tool);
        setFormData({});
        setResult("");
        setCopied(false);
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleRunTool = async () => {
        setLoading(true);
        setResult("");

        const { data: { user } } = await supabase.auth.getUser();

        // 1. DEBUG: Log what we are sending
        console.log("🚀 Sending Request to:", `${process.env.NEXT_PUBLIC_API_URL}/tools/run`);
        console.log("📦 Payload:", {
            user_id: user?.id,
            tool_id: activeTool.id,
            inputs: formData,
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user?.id || "guest", // Fallback if user is null
                    tool_id: activeTool.id,
                    inputs: formData,
                }),
            });

            // 2. DEBUG: Check if the server rejected it
            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ Server Error:", res.status, errorText);
                alert(`Server Error ${res.status}: ${errorText}`);
                return; // Stop here
            }

            const data = await res.json();

            // 3. DEBUG: Log the success response
            console.log("✅ Server Response:", data);

            if (data.result) {
                setResult(data.result);
            } else {
                console.warn("⚠️ Response missing 'result' field:", data);
                alert("AI finished but returned empty result. Check console.");
            }

        } catch (error) {
            // 4. DEBUG: Network or Logic errors
            console.error("🚨 Network/Logic Error:", error);
            alert("Something went wrong. Check the Console (F12) for details.");
        } finally {
            setLoading(false);
        }
    };
    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && resultRef.current) {
            resultRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [result]);


    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    AI Tool Collection
                </h1>
                <p className="text-slate-500 mt-2">
                    High-leverage micro-tools for founders & builders.
                </p>
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {TOOLS.map((tool) => (
                    <Card
                        key={tool.id}
                        onClick={() => openTool(tool)}
                        className="
    group relative cursor-pointer
    rounded-2xl border border-slate-200 dark:border-slate-800
    bg-white dark:bg-slate-950
    transition-all duration-300
    hover:-translate-y-1 hover:shadow-xl
  "
                    >
                        <CardHeader className="flex flex-row items-center gap-4 p-6">
                            <div className="
      flex items-center justify-center
      h-12 w-12 rounded-xl
      bg-slate-100 dark:bg-slate-800
      transition-transform group-hover:scale-105
    ">
                                {tool.icon}
                            </div>

                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold">
                                    {tool.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-snug">
                                    {tool.desc}
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                ))}
            </div>

            {/* THE DRAWER (SHEET) */}
            <Sheet open={!!activeTool} onOpenChange={() => setActiveTool(null)}>
                {/* Added 'overflow-y-auto' so you can scroll */}
                <SheetContent
                    side="right"
                    className="
    w-full sm:max-w-xl
    p-0
    bg-white dark:bg-slate-950
    border-l border-slate-200 dark:border-slate-800
  "
                >
                    {activeTool && (
                        <div className="flex h-full flex-col">

                            {/* Sticky Header */}
                            <div className="
        sticky top-0 z-10
        bg-white dark:bg-slate-950
        border-b border-slate-200 dark:border-slate-800
        px-6 py-5
      ">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        {activeTool.icon}
                                    </div>
                                    <div>
                                        <SheetTitle className="text-xl font-semibold">
                                            {activeTool.title}
                                        </SheetTitle>
                                        <SheetDescription className="text-sm">
                                            {activeTool.desc}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                                {/* Inputs */}
                                {activeTool.inputs.map((input: any) => (
                                    <div key={input.name} className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            {input.label}
                                        </Label>

                                        {input.type === "textarea" ? (
                                            <Textarea
                                                placeholder={input.placeholder}
                                                className="
                  min-h-[120px]
                  resize-none
                  focus-visible:ring-blue-500
                "
                                                onChange={(e) =>
                                                    handleInputChange(input.name, e.target.value)
                                                }
                                            />
                                        ) : (
                                            <Input
                                                placeholder={input.placeholder}
                                                className="h-11 focus-visible:ring-blue-500"
                                                onChange={(e) =>
                                                    handleInputChange(input.name, e.target.value)
                                                }
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* Result */}
                                {result && (
                                    <div
                                        ref={resultRef}
                                        className="
              rounded-xl border
              border-slate-200 dark:border-slate-800
              bg-slate-50 dark:bg-slate-900/50
              p-5
              space-y-4
            "
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold uppercase tracking-wide">
                                                AI Result
                                            </span>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={copyToClipboard}
                                                className="gap-2"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {result}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer CTA */}
                            <div className="
        border-t border-slate-200 dark:border-slate-800
        px-6 py-4
        bg-white dark:bg-slate-950
      ">
                                <Button
                                    onClick={handleRunTool}
                                    disabled={loading}
                                    className="
            w-full h-12 text-base font-semibold
            bg-blue-600 hover:bg-blue-700
          "
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-5 w-5" />
                                            Run {activeTool.title}
                                        </>
                                    )}
                                </Button>
                            </div>

                        </div>
                    )}
                </SheetContent>

            </Sheet>


        </div>
    );
}
