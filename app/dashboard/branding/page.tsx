"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function BrandingSuite() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("Modern");

  const [names, setNames] = useState<string[]>([]);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [savedAssets, setSavedAssets] = useState<any[]>([]);

  const [generationType, setGenerationType] = useState<
    "name" | "slogan" | "logo" | null
  >(null);

  useEffect(() => {
    fetchSavedAssets();
  }, []);

  const fetchSavedAssets = async () => {
    try {
      setPageLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${user.id}`
      );
      const data = await res.json();
      setSavedAssets(data);
    } finally {
      setPageLoading(false);
    }
  };

  /* ================================
     ✅ UPDATED GENERATE FUNCTION
     ================================ */
  const handleGenerate = async (type: "name" | "slogan" | "logo") => {
    if (!keywords) {
      alert("Please enter some keywords about your business.");
      return;
    }

    setGenerationType(type);
    setLoading(true);
    setLogoUrl(""); // reset logo

    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1️⃣ Generate text (name, slogan, or logo prompt)
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/branding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          asset_type: type,
          keywords,
          style,
        }),
      });

      const data = await res.json();

      if (type === "name" || type === "slogan") {
        try {
          const list = JSON.parse(data.result);
          type === "name" ? setNames(list) : setSlogans(list);
        } catch {
          type === "name"
            ? setNames([data.result])
            : setSlogans([data.result]);
        }
      } else {
        // 2️⃣ Generate logo image from backend (Hugging Face)
        const imageRes = await fetch(
          "${process.env.NEXT_PUBLIC_API_URL}/branding/generate-image",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: data.result,
            }),
          }
        );

        if (!imageRes.ok) {
          throw new Error("Image generation failed");
        }

        const imageData = await imageRes.json();

        // Base64 image returned from backend
        setLogoUrl(imageData.image_url);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating assets. Check backend logs.");
    } finally {
      setLoading(false);
      setGenerationType(null);
    }
  };

  /* ================================ */

  const downloadImage = async () => {
    if (!logoUrl) return;
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `FoundrKit_Logo_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAsset = async (type: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch("${process.env.NEXT_PUBLIC_API_URL}/branding/assets/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        asset_type: type,
        content,
      }),
    });

    fetchSavedAssets();
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Remove this asset?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/branding/assets/${id}`, {
      method: "DELETE",
    });
    setSavedAssets(savedAssets.filter((a) => a.id !== id));
  };

  if (pageLoading) return <PageLoader />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Branding Suite
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        High-impact brand creation powered by AI
      </p>

      {/* Controls */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label className="text-slate-800 dark:text-slate-300">
              Describe your business
            </Label>
            <Input
              placeholder="e.g. A coffee shop for coders"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="w-[220px] space-y-2">
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
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg"
          >
            <Type className="mr-2 w-4 h-4" />
            Business Names
          </TabsTrigger>
          <TabsTrigger
            value="slogans"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg"
          >
            <PenTool className="mr-2 w-4 h-4" />
            Slogans
          </TabsTrigger>
          <TabsTrigger
            value="logos"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black rounded-lg"
          >
            <ImageIcon className="mr-2 w-4 h-4" />
            Logo Generator
          </TabsTrigger>
        </TabsList>

        {/* Name Generator */}
        <TabsContent value="names" className="mt-6">
          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              onClick={() => handleGenerate("name")}
              disabled={loading}
            >
              {generationType === "name" ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Sparkles className="mr-2" />
              )}
              Generate Names
            </Button>

            {generationType === "name" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[1, 2, 3, 4].map((i) => (
                  <Card
                    key={i}
                    className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl"
                  >
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 dark:bg-slate-800" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {names.map((name, i) => (
                  <Card
                    key={i}
                    className="hover:shadow-xl transition border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl"
                  >
                    <CardContent className="p-6 flex justify-between items-center">
                      <span className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {name}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigator.clipboard.writeText(name)}
                        >
                          <Copy className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveAsset("name", name)}
                        >
                          <Heart className="h-4 w-4 text-red-400" />
                        </Button>
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
              disabled={loading}
            >
              {generationType === "slogan" ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Sparkles className="mr-2" />
              )}
              Generate Slogans
            </Button>

            {generationType === "slogan" ? (
              <div className="space-y-3 w-full max-w-2xl">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl"
                  >
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-full dark:bg-slate-800" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-2xl">
                {slogans.map((slogan, i) => (
                  <Card
                    key={i}
                    className="hover:shadow-xl transition border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl"
                  >
                    <CardContent className="p-6 flex justify-between items-center">
                      <span className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {slogan}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigator.clipboard.writeText(slogan)}
                        >
                          <Copy className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveAsset("slogan", slogan)}
                        >
                          <Heart className="h-4 w-4 text-red-400" />
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
              disabled={loading}
            >
              {generationType === "logo" ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Sparkles className="mr-2" />
              )}
              {generationType === "logo" ? "Designing..." : "Generate AI Logo"}
            </Button>

            {logoUrl && (
              <Button
                variant="outline"
                onClick={() => handleSaveAsset("logo", logoUrl)}
                className="dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              >
                <Heart className="mr-2 h-4 w-4" /> Save to Library
              </Button>
            )}

            {generationType === "logo" ? (
              <Skeleton className="w-[300px] h-[300px] rounded-2xl dark:bg-slate-800" />
            ) : logoUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={logoUrl}
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
          <p className="text-slate-500 dark:text-slate-400">No saved assets yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedAssets.map((asset) => (
              <Card
                key={asset.id}
                className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md dark:bg-slate-900 hover:shadow-xl transition-all"
              >
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  <Trash2 size={14} />
                </Button>

                {asset.asset_type === "logo" ? (
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                    <img
                      src={asset.content}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <CardContent className="p-6">
                    <span className="text-xs font-bold text-blue-600 uppercase">
                      {asset.asset_type}
                    </span>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-2 leading-snug">
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
