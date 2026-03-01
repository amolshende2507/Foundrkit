"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [website, setWebsite] = useState("");

  const [userId, setUserId] = useState<string | null>(null);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

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

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("brand_settings")
        .upsert(
          {
            user_id: userId,
            company_name: companyName,
            company_description: description,
            tone_of_voice: tone,
            website_url: website,
            updated_at: new Date(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setMessage({ type: "success", text: "Brand settings saved successfully!" });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-slate-500">
          Manage your Brand DNA. This data powers your AI tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <CardTitle>Brand DNA</CardTitle>
          </div>
          <CardDescription>
            The AI uses this context to write like you.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Company / Project Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>What do you do?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Voice</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Bold">Bold</SelectItem>
                <SelectItem value="Luxury">Luxury</SelectItem>
                <SelectItem value="Tech">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {message && (
            <Alert variant={message.type === "success" ? "default" : "destructive"}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}