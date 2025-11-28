"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    async function getSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
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

  const handleSave = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("User not found");

    const updates = {
      user_id: user.id,
      company_name: companyName,
      company_description: description,
      tone_of_voice: tone,
      website_url: website,
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from("brand_settings")
      .upsert(updates, { onConflict: "user_id" });

    if (error) alert("Error: " + error.message);
    else alert("Brand settings saved!");

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Brand Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Teach the AI about your company style.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            Company Profile
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            The AI will use this to write proposals and emails for you.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Company Name */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">Company Name</Label>
            <Input
              placeholder="Acme Design Studio"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">
              What do you do? (The more detail, the better)
            </Label>
            <Textarea
              placeholder="We design high-converting websites for dental clinics..."
              className="h-32 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tone + Website */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Tone of Voice</Label>
              <Input
                placeholder="e.g., Witty, Corporate, Friendly"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Website URL</Label>
              <Input
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="
              w-full mt-4 h-11 rounded-xl
              bg-slate-900 hover:bg-slate-800 text-white
              dark:bg-white dark:text-slate-900 dark:hover:bg-slate-300
            "
          >
            {loading ? "Saving..." : "Save Brand Settings"}
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
