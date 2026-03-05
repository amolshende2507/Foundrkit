"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Type, Image as ImageIcon, PenTool, Download, Heart, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/PageLoader";

export default function BrandingSuite() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("Modern");
  const [names, setNames] = useState<{ name: string; meaning: string }[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [savedAssets, setSavedAssets] = useState<any[]>([]);
  const [generationType, setGenerationType] = useState<"name" | "slogan" | "logo" | null>(null);

  // Initialize: Get User once and fetch assets
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${user.id}`);
        const data = await res.json();
        setSavedAssets(data);
      }
      setPageLoading(false);
    }
    init();
  }, []);

  const handleGenerate = async (type: "name" | "slogan" | "logo") => {
    if (!keywords || !userId) return alert("Please enter keywords.");

    setGenerationType(type);
    setLoading(true);
    if (type === "logo") setLogoUrl("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, asset_type: type, keywords, style }),
      });

      const data = await res.json();

      if (type === "name" || type === "slogan") {
        try {
          const list = JSON.parse(data.result);
          type === "name" ? setNames(list) : setSlogans(list);
        } catch {
          type === "name" 
            ? setNames([{ name: data.result, meaning: "AI generated" }]) 
            : setSlogans([data.result]);
        }
      } else {
        const imageRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: data.result }),
        });
        const imageData = await imageRes.json();
        setLogoUrl(imageData.image_url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setGenerationType(null);
    }
  };

  const handleSaveAsset = async (type: string, content: string) => {
    if (!userId) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, asset_type: type, content }),
    });
    if (res.ok) {
      const newAsset = await res.json();
      setSavedAssets((prev) => [newAsset, ...prev]);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Remove asset?")) return;
    setSavedAssets(prev => prev.filter(a => a.id !== id)); // Optimistic delete
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${id}`, { method: "DELETE" });
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Branding Suite</h1>
        <p className="text-sm text-slate-500 mt-1">AI-powered high-impact brand creation</p>
      </header>

      <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <Label>Describe your business</Label>
            <Input 
              placeholder="e.g. A luxury coffee brand for software engineers" 
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="w-full md:w-[200px] space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800"><SelectValue /></SelectTrigger>
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

      <Tabs defaultValue="names" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/50 dark:bg-slate-900 p-1">
          <TabsTrigger value="names"><Type className="mr-2 w-4 h-4" /> Names</TabsTrigger>
          <TabsTrigger value="slogans"><PenTool className="mr-2 w-4 h-4" /> Slogans</TabsTrigger>
          <TabsTrigger value="logos"><ImageIcon className="mr-2 w-4 h-4" /> Logos</TabsTrigger>
        </TabsList>

        <TabsContent value="names" className="mt-6 space-y-6">
          <div className="flex justify-center">
            <Button size="lg" onClick={() => handleGenerate("name")} disabled={loading}>
              {generationType === "name" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Generate Names
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && generationType === "name" ? [1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />) : 
              names.map((item, i) => (
                <Card key={i} className="group hover:border-blue-500 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-bold">{item.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(item.name)}><Copy className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSaveAsset("name", item.name)}><Heart className="h-4 w-4 text-red-400"/></Button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 italic border-t pt-2">"{item.meaning}"</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="slogans" className="mt-6 space-y-6">
          <div className="flex justify-center">
            <Button size="lg" onClick={() => handleGenerate("slogan")} disabled={loading}>
              {generationType === "slogan" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Generate Slogans
            </Button>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            {loading && generationType === "slogan" ? [1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) :
              slogans.map((slogan, i) => (
                <Card key={i} className="flex justify-between items-center p-6">
                  <span className="text-lg font-semibold">{slogan}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(slogan)}><Copy className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSaveAsset("slogan", slogan)}><Heart className="h-4 w-4 text-red-400"/></Button>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="logos" className="mt-6 flex flex-col items-center gap-6">
          <Button size="lg" onClick={() => handleGenerate("logo")} disabled={loading}>
            {generationType === "logo" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {generationType === "logo" ? "Designing..." : "Generate AI Logo"}
          </Button>

          {generationType === "logo" ? <Skeleton className="w-[300px] h-[300px] rounded-2xl" /> : 
            logoUrl ? (
              <div className="text-center space-y-4">
                <img src={logoUrl} className="w-[300px] h-[300px] rounded-2xl shadow-2xl border" alt="Logo" />
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => handleSaveAsset("logo", logoUrl)}><Heart className="mr-2 h-4 w-4"/>Save</Button>
                  <Button variant="ghost" onClick={() => handleGenerate("logo")}>Try Again</Button>
                </div>
              </div>
            ) : (
              <div className="w-[300px] h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900">
                <ImageIcon size={48} className="opacity-20" />
                <p className="text-xs mt-2">No logo generated</p>
              </div>
            )}
        </TabsContent>
      </Tabs>

      <section className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Saved Library</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {savedAssets.map((asset) => (
            <Card key={asset.id} className="relative group overflow-hidden">
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10" onClick={() => handleDeleteAsset(asset.id)}><Trash2 size={14} /></Button>
              {asset.asset_type === "logo" ? <img src={asset.content} className="aspect-square object-cover w-full" /> : 
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-blue-600 uppercase">{asset.asset_type}</p>
                  <p className="text-sm font-medium mt-1">{asset.content}</p>
                </CardContent>
              }
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}