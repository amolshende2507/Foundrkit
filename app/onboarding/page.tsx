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
    role: "", // e.g. Founder, Freelancer
    company_name: "",
    company_description: "",
    industry: "",
    tone: "Professional",
    website: ""
  });

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // 1. Update Profile (Name)
      await supabase.from("profiles").update({ full_name: formData.full_name }).eq("id", user.id);

      // 2. Insert Brand Settings (The AI Context)
      const { error } = await supabase.from("brand_settings").upsert({
        user_id: user.id,
        company_name: formData.company_name,
        company_description: formData.company_description,
        tone_of_voice: formData.tone,
        website_url: formData.website
      });

      if (error) throw error;

      // 3. (Optional) Create a 'First Task' automatically
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: "Complete my FoundrKit Profile",
          status: "done"
        })
      });

      // Redirect to Dashboard
      router.push("/dashboard");

    } catch (error) {
      alert("Error saving profile. Please try again.");
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
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 transition-all shadow-sm ${step >= i ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-300 border-slate-200"
              }`}>
              {step > i ? <CheckCircle2 size={20} /> : i}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {i === 1 ? "You" : i === 2 ? "Business" : "AI Context"}
            </span>
          </div>
        ))}
        {/* Lines between circles */}
        <div className="absolute w-full max-w-[300px] h-[2px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 -z-10 top-[50%] translate-y-[-50%] hidden md:block" />

      </div>

      <Card className="w-full max-w-md shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] border border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center tracking-tight text-slate-900">
            {step === 1 && "Let's get to know you"}
            {step === 2 && "Tell us about your startup"}
            {step === 3 && "Train your AI Co-Founder"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* STEP 1: PERSONAL INFO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>What should we call you?</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

                  <Input className="h-11 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                    placeholder="Your Full Name" value={formData.full_name} onChange={e => updateForm("full_name", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What describes you best?</Label>
                <Select onValueChange={val => updateForm("role", val)}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Solo Founder</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="student">Student Entrepreneur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS INFO */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>Company / Project Name</Label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input className="h-11 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                    placeholder="e.g. Neon Studio" value={formData.company_name} onChange={e => updateForm("company_name", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website (Optional)</Label>
                <Input placeholder="https://..." value={formData.website} onChange={e => updateForm("website", e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 3: AI CONTEXT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>What does your business do?</Label>
                <Textarea
                  placeholder="We build websites for dentists..."
                  className="h-24"
                  value={formData.company_description}
                  onChange={e => updateForm("company_description", e.target.value)}
                />
                <p className="text-xs text-slate-500">The AI uses this to write your proposals.</p>
              </div>
              <div className="space-y-2">
                <Label>Brand Tone</Label>
                <Select onValueChange={val => updateForm("tone", val)} defaultValue="Professional">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional & Corporate</SelectItem>
                    <SelectItem value="Friendly">Friendly & Casual</SelectItem>
                    <SelectItem value="Exciting">Exciting & Bold</SelectItem>
                    <SelectItem value="Luxury">Luxury & Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center mt-1 text-xs font-medium text-blue-600">
                Your AI learns from this
              </div>

            </div>
          )}

        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div /> // Empty div to keep spacing
          )}

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!formData.full_name && step === 1 || !formData.company_name && step === 2} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading || !formData.company_description}
              className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
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