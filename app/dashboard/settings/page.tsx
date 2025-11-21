"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [website, setWebsite] = useState("");

  // 1. Fetch existing data when page loads
  useEffect(() => {
    async function getSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCompanyName(data.company_name || "");
        setDescription(data.company_description || "");
        setTone(data.tone_of_voice || "Professional");
        setWebsite(data.website_url || "");
      }
    }
    getSettings();
  }, []);

  // 2. Save Data to Supabase
  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("User not found");
      return;
    }

    const updates = {
      user_id: user.id,
      company_name: companyName,
      company_description: description,
      tone_of_voice: tone,
      website_url: website,
      updated_at: new Date(),
    };

    // Upsert = Update if exists, Insert if new
    const { error } = await supabase
      .from("brand_settings")
      .upsert(updates, { onConflict: "user_id" });

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      alert("Brand settings saved! The AI now knows your company.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Brand Settings</h1>
        <p className="text-slate-600">Teach the AI about your company style.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>The AI will use this to write proposals and emails for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input 
              placeholder="Acme Design Studio" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>What do you do? (The more detail, the better)</Label>
            <Textarea 
              placeholder="We design high-converting websites for dental clinics..."
              className="h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone of Voice</Label>
              <Input 
                placeholder="e.g., Witty, Corporate, Friendly" 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input 
                placeholder="https://..." 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full mt-4">
            {loading ? "Saving..." : "Save Brand Settings"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}