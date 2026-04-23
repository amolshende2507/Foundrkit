"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Copy,
  Type,
  Image as ImageIcon,
  PenTool,
  Download,
  Heart,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/PageLoader";

// ✅ TYPESCRIPT INTERFACES
interface BrandName {
  name: string;
  meaning: string;
}

interface SavedAsset {
  id: string;
  asset_type: "name" | "slogan" | "logo";
  content: string;
}

type GenerationType = "name" | "slogan" | "logo" | null;

export default function BrandingSuite() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("Modern");

  // ✅ TYPED STATE
  const [names, setNames] = useState<BrandName[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);

  const [generationType, setGenerationType] = useState<GenerationType>(null);

  // ✅ FETCH SAVED ASSETS (Cache Busting Added)
  const fetchSavedAssets = useCallback(async () => {
    try {
      setPageLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🛑 FIXED: Added cache: "no-store" and a timestamp query so it NEVER serves stale cached data
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${user.id}?t=${Date.now()}`,
        { cache: "no-store" }
      );
      
      if (!res.ok) throw new Error("Failed to fetch saved assets");
      
      const data: SavedAsset[] = await res.json();
      setSavedAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedAssets();
  }, [fetchSavedAssets]);

  /* ================================
     ✅ GENERATE FUNCTION
     ================================ */
  const handleGenerate = async (type: GenerationType) => {
    if (!type) return;
    if (!keywords.trim()) {
      alert("Please enter some keywords about your business.");
      return;
    }

    setGenerationType(type);
    setLoading(true);
    if (type === "logo") setLogoUrl(""); // reset logo on new generation

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          asset_type: type,
          keywords,
          style,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate text content");
      const data = await res.json();

      if (type === "name" || type === "slogan") {
        try {
          const list = JSON.parse(data.result);
          type === "name" ? setNames(list) : setSlogans(list);
        } catch {
          if (type === "name") {
            setNames([{ name: data.result, meaning: "AI generated result" }]);
          } else {
            setSlogans([data.result]);
          }
        }
      } else if (type === "logo") {
        const imageRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/branding/generate-image`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: data.result }),
          }
        );

        if (!imageRes.ok) throw new Error("Image generation failed");

        const imageData = await imageRes.json();
        setLogoUrl(imageData.image_url);
      }
    } catch (error) {
      console.error("Generation Error:", error);
      alert("Error generating assets. Please try again.");
    } finally {
      setLoading(false);
      setGenerationType(null);
    }
  };

  /* ================================
     ✅ UTILS & ACTIONS
     ================================ */
  const downloadImage = async () => {
    if (!logoUrl) return;
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `FoundrKit_Logo_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  // 🛑 FIXED: Optimistic UI added so it saves instantly visually
  const handleSaveAsset = async (type: "name" | "slogan" | "logo", content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic UI Update: Make it appear instantly in the library
      const tempId = `temp_${Date.now()}`;
      setSavedAssets((prev) => [...prev, { id: tempId, asset_type: type, content }]);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          asset_type: type,
          content,
        }),
      });

      if (!res.ok) throw new Error("Failed to save asset");
      
      // Refresh library in the background to swap the tempId for the real database ID
      await fetchSavedAssets();
    } catch (error) {
      console.error("Error saving asset:", error);
      // Re-fetch to clear the optimistic update if the save failed
      await fetchSavedAssets();
      alert("Failed to save asset.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Remove this asset?")) return;
    try {
      // Optimistic UI update for immediate visual removal
      setSavedAssets((prev) => prev.filter((a) => a.id !== id));

      // Don't try to delete temporary optimistic IDs from DB
      if (id.startsWith("temp_")) return; 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete asset");
      
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset.");
      await fetchSavedAssets(); // Restore if deletion failed
    }
  };

  const renderSkeletons = (count: number, className: string = "h-6 w-3/4") => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className={`${className} dark:bg-slate-800`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Branding Suite
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-impact brand creation powered by AI
        </p>
      </div>

      {/* Controls */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="keywords" className="text-slate-800 dark:text-slate-300">
              Describe your business
            </Label>
            <Input
              id="keywords"
              placeholder="e.g. A coffee shop for coders"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="w-full md:w-[220px] space-y-2">
            <Label className="text-slate-800 dark:text-slate-300">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border dark:border-slate-700">
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

      {/* Tabs */}
      <Tabs defaultValue="names" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
          <TabsTrigger
            value="names"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg transition-all"
          >
            <Type className="mr-2 w-4 h-4 hidden sm:block" />
            <span className="truncate">Names</span>
          </TabsTrigger>
          <TabsTrigger
            value="slogans"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg transition-all"
          >
            <PenTool className="mr-2 w-4 h-4 hidden sm:block" />
            <span className="truncate">Slogans</span>
          </TabsTrigger>
          <TabsTrigger
            value="logos"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg transition-all"
          >
            <ImageIcon className="mr-2 w-4 h-4 hidden sm:block" />
            <span className="truncate">Logos</span>
          </TabsTrigger>
        </TabsList>

        {/* Name Generator */}
        <TabsContent value="names" className="mt-6">
          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              onClick={() => handleGenerate("name")}
              disabled={loading || !keywords.trim()}
              className="w-full md:w-auto"
            >
              {generationType === "name" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Generate Names
            </Button>

            {generationType === "name" ? (
              renderSkeletons(4)
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {names.map((item, i) => (
                  <Card key={i} className="group hover:border-blue-500 transition-colors border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {item.name}
                        </span>
                        <div className="flex gap-1 opacity-100 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy to clipboard"
                            onClick={() => navigator.clipboard.writeText(item.name)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Save to Library"
                            onClick={() => handleSaveAsset("name", item.name)}
                          >
                            <Heart className="h-4 w-4 text-red-400 hover:fill-red-400" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          "{item.meaning}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Slogan Generator */}
        <TabsContent value="slogans" className="mt-6">
          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              onClick={() => handleGenerate("slogan")}
              disabled={loading || !keywords.trim()}
              className="w-full md:w-auto"
            >
              {generationType === "slogan" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Generate Slogans
            </Button>

            {generationType === "slogan" ? (
              <div className="w-full max-w-2xl">{renderSkeletons(3, "h-6 w-full")}</div>
            ) : (
              <div className="space-y-3 w-full max-w-2xl">
                {slogans.map((slogan, i) => (
                  <Card key={i} className="group hover:shadow-xl transition border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <span className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {slogan}
                      </span>
                      <div className="flex gap-2 self-end md:self-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copy to clipboard"
                          onClick={() => navigator.clipboard.writeText(slogan)}
                        >
                          <Copy className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Save to Library"
                          className="hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleSaveAsset("slogan", slogan)}
                        >
                          <Heart className="h-4 w-4 text-red-400 hover:fill-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Logo Generator */}
        <TabsContent value="logos" className="mt-6">
          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              onClick={() => handleGenerate("logo")}
              disabled={loading || !keywords.trim()}
              className="w-full md:w-auto"
            >
              {generationType === "logo" ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              {generationType === "logo" ? "Designing..." : "Generate AI Logo"}
            </Button>

            {logoUrl && !generationType && (
              <Button
                variant="outline"
                onClick={() => handleSaveAsset("logo", logoUrl)}
                className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 hover:text-red-500"
              >
                <Heart className="mr-2 h-4 w-4 text-red-400" /> Save to Library
              </Button>
            )}

            {generationType === "logo" ? (
              <Skeleton className="w-[300px] h-[300px] rounded-2xl dark:bg-slate-800" />
            ) : logoUrl ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <img
                  src={logoUrl}
                  alt="Generated Logo"
                  className="w-[300px] h-[300px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl object-cover"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadImage}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button variant="ghost" onClick={() => handleGenerate("logo")}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-[300px] h-[300px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 shadow-inner">
                <ImageIcon size={48} className="opacity-20" />
                <p className="text-xs mt-2">No logo generated yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Saved Assets Library */}
      <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          Saved Asset Library
        </h2>

        {savedAssets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <p className="text-slate-500 dark:text-slate-400">No saved assets yet. Generate and save some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {savedAssets.map((asset) => (
              <Card
                key={asset.id}
                className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:bg-slate-900 transition-all"
              >
                <Button
                  variant="destructive"
                  size="icon"
                  title="Delete asset"
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition z-10 h-8 w-8"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  <Trash2 size={14} />
                </Button>

                {asset.asset_type === "logo" ? (
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                    <img
                      src={asset.content}
                      alt="Saved Logo"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <CardContent className="p-6 h-full flex flex-col justify-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 block">
                      {asset.asset_type}
                    </span>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {asset.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}