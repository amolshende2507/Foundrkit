"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, CheckCircle2, Building2, Sparkles, User } from "lucide-react";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    full_name: "",
    role: "",
    company_name: "",
    company_description: "",
    industry: "",
    tone: "Professional",
    website: ""
  });

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ✅ SAFE INSERT / UPDATE LOGIC WITH USER ID CHECK
  const handleOnboarding = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // 🔒 --- CRITICAL SAFETY CHECK ---
    if (!user || !user.id) {
      console.error("CRITICAL: User ID is missing!");
      alert("Session error. Please log out and log in again.");
      setLoading(false);
      return;
    }

    console.log("Saving for User ID:", user.id);
    // ---------------------------------

    const payload = {
      user_id: user.id,
      company_name: formData.company_name,
      company_description: formData.company_description,
      tone_of_voice: formData.tone,
      website_url: formData.website
    };

    try {
      // Optional: Update profile name
      await supabase
        .from("profiles")
        .update({ full_name: formData.full_name })
        .eq("id", user.id);

      // Check if brand already exists
      const { data: existingRow, error: selectError } = await supabase
        .from("brand_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selectError) throw selectError;

      let error;

      if (existingRow) {
        console.log("Found existing profile, updating...");
        const res = await supabase
          .from("brand_settings")
          .update(payload)
          .eq("user_id", user.id);
        error = res.error;
      } else {
        console.log("No profile found, creating new...");
        const res = await supabase
          .from("brand_settings")
          .insert(payload);
        error = res.error;
      }

      if (error) throw error;

      // Optional: Create first task
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: "Complete my FoundrKit Profile",
          status: "done"
        })
      });

      router.push("/dashboard");

    } catch (err: any) {
      console.error("Detailed Error:", err);
      alert(`Error: ${err.message || err.details || "Check console"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 transition-all shadow-sm ${
              step >= i
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-300 border-slate-200"
            }`}>
              {step > i ? <CheckCircle2 size={20} /> : i}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {i === 1 ? "You" : i === 2 ? "Business" : "AI Context"}
            </span>
          </div>
        ))}
      </div>

      <Card className="w-full max-w-md shadow-xl border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {step === 1 && "Let's get to know you"}
            {step === 2 && "Tell us about your startup"}
            {step === 3 && "Train your AI Co-Founder"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {step === 1 && (
            <div className="space-y-4">
              <Label>Your Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={e => updateForm("full_name", e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Company Name</Label>
              <Input
                value={formData.company_name}
                onChange={e => updateForm("company_name", e.target.value)}
              />
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={e => updateForm("website", e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Business Description</Label>
              <Textarea
                value={formData.company_description}
                onChange={e => updateForm("company_description", e.target.value)}
              />
              <Label>Brand Tone</Label>
              <Select
                onValueChange={val => updateForm("tone", val)}
                defaultValue="Professional"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Exciting">Exciting</SelectItem>
                  <SelectItem value="Luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !formData.full_name) ||
                (step === 2 && !formData.company_name)
              }
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleOnboarding}
              disabled={loading || !formData.company_description}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Launch HQ
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}