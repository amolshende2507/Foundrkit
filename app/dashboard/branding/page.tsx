"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Type, Image as ImageIcon, PenTool,Download  } from "lucide-react";

export default function BrandingSuite() {
    const [loading, setLoading] = useState(false);
    const [keywords, setKeywords] = useState("");
    const [style, setStyle] = useState("Modern");

    // Results
    const [names, setNames] = useState<string[]>([]);
    const [slogans, setSlogans] = useState<string[]>([]);
    const [logoUrl, setLogoUrl] = useState("");

    const handleGenerate = async (type: string) => {
        if (!keywords) {
            alert("Please enter some keywords about your business.");
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        try {
            const res = await fetch("http://localhost:8000/branding/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user?.id,
                    asset_type: type,
                    keywords: keywords,
                    style: style
                })
            });
            const data = await res.json();

            if (type === "name" || type === "slogan") {
                // Parse JSON list
                try {
                    const list = JSON.parse(data.result);
                    if (type === "name") setNames(list);
                    if (type === "slogan") setSlogans(list);
                } catch (e) {
                    // Fallback if AI returns plain text
                    type === "name" ? setNames([data.result]) : setSlogans([data.result]);
                }
            } else if (type === "logo") {
                // 1. Get the description from Gemini
                const prompt = data.result;
                // 2. Create the Image URL (using Pollinations.ai - Free Stable Diffusion)
                // We add a random seed so it changes every time
                const seed = Math.floor(Math.random() * 10000);
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=512&height=512`;
                setLogoUrl(url);
            }

        } catch (error) {
            alert("Error generating assets.");
        } finally {
            setLoading(false);
        }
    };
    const downloadImage = async () => {
        if (!logoUrl) return;
        try {
            // Fetch the image as a "blob" (file)
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Create a fake link and click it
            const link = document.createElement("a");
            link.href = url;
            link.download = `FoundrKit_Logo_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert("Download failed. Try right-clicking the image.");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Branding Suite</h1>
                <p className="text-slate-600">Generate your identity from scratch.</p>
            </div>

            {/* Controls */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-6 flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label>Describe your business</Label>
                        <Input placeholder="e.g. A coffee shop for coders" value={keywords} onChange={e => setKeywords(e.target.value)} />
                    </div>
                    <div className="w-[200px] space-y-2">
                        <Label>Style</Label>
                        <Select value={style} onValueChange={setStyle}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Modern">Modern</SelectItem>
                                <SelectItem value="Minimalist">Minimalist</SelectItem>
                                <SelectItem value="Playful">Playful</SelectItem>
                                <SelectItem value="Luxury">Luxury</SelectItem>
                                <SelectItem value="Tech">Tech / Cyber</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Tools */}
            <Tabs defaultValue="names" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100">
                    <TabsTrigger value="names" className="data-[state=active]:bg-white"><Type className="mr-2 w-4 h-4" /> Business Names</TabsTrigger>
                    <TabsTrigger value="slogans" className="data-[state=active]:bg-white"><PenTool className="mr-2 w-4 h-4" /> Slogans</TabsTrigger>
                    <TabsTrigger value="logos" className="data-[state=active]:bg-white"><ImageIcon className="mr-2 w-4 h-4" /> Logo Generator</TabsTrigger>
                </TabsList>

                {/* 1. NAMES TAB */}
                <TabsContent value="names" className="mt-6">
                    <div className="flex flex-col items-center gap-6">
                        <Button size="lg" onClick={() => handleGenerate("name")} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />} Generate Names
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {names.map((name, i) => (
                                <Card key={i} className="hover:shadow-md cursor-pointer" onClick={() => navigator.clipboard.writeText(name)}>
                                    <CardContent className="p-6 text-center flex justify-between items-center">
                                        <span className="text-xl font-bold text-slate-800">{name}</span>
                                        <Copy className="h-4 w-4 text-slate-400" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* 2. SLOGANS TAB */}
                <TabsContent value="slogans" className="mt-6">
                    <div className="flex flex-col items-center gap-6">
                        <Button size="lg" onClick={() => handleGenerate("slogan")} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />} Generate Slogans
                        </Button>
                        <div className="space-y-3 w-full max-w-2xl">
                            {slogans.map((slogan, i) => (
                                <Card key={i} className="hover:shadow-md cursor-pointer" onClick={() => navigator.clipboard.writeText(slogan)}>
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <span className="text-lg text-slate-700 italic">"{slogan}"</span>
                                        <Copy className="h-4 w-4 text-slate-400" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* 3. LOGO TAB (The SVG Hack) */}
                <TabsContent value="logos" className="mt-6">
                    <div className="flex flex-col items-center gap-6">
                        <Button size="lg" onClick={() => handleGenerate("logo")} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                            {loading ? "Designing..." : "Generate AI Logo"}
                        </Button>

                        {logoUrl ? (
                            <div className="flex flex-col gap-4 items-center animate-in fade-in zoom-in duration-500">
                                <Card className="p-2 bg-white border-2 border-slate-100 shadow-lg rounded-xl overflow-hidden">
                                    {/* Display Real Image */}
                                    <img
                                        src={logoUrl}
                                        alt="AI Generated Logo"
                                        className="w-[300px] h-[300px] object-cover rounded-lg"
                                    />
                                </Card>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={downloadImage}>
                                        <Download className="mr-2 h-4 w-4" /> Download JPG
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleGenerate("logo")}>
                                        Try Again
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 max-w-xs text-center">
                                    Tip: Use specific keywords like "Minimalist, blue, tech" for better results.
                                </p>
                            </div>
                        ) : (
                            <div className="w-[300px] h-[300px] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50/50">
                                <div className="text-center space-y-2">
                                    <ImageIcon size={48} className="opacity-20 mx-auto" />
                                    <p className="text-sm">No logo generated yet.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}