"use client";

import { SiteFooter } from "@/components/landing/Footer";
import { SiteHeader } from "@/components/landing/Header";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-6 py-20">

        <motion.div initial="hidden" animate="show" variants={fade} className="mb-8 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-sky-300" />
          <h1 className="text-4xl font-bold text-white">Changelog</h1>
        </motion.div>

        <motion.p initial="hidden" animate="show" variants={fade} className="text-slate-400 mb-12">
          Tracking major improvements, features, and refinements made to FoundrKit.
        </motion.p>

        <div className="space-y-14">

          <motion.div initial="hidden" whileInView="show" variants={fade} viewport={{ once: true }}>
            <h3 className="text-xl text-white font-semibold">🚀 Version 1.0 — Initial Release</h3>
            <p className="text-slate-400 mt-2">
              • Next.js + Supabase authentication  
              • Personal dashboard  
              • AI-powered proposal generator  
              • Client & task manager  
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" variants={fade} viewport={{ once: true }}>
            <h3 className="text-xl text-white font-semibold">✨ UI/UX Enhancements</h3>
            <p className="text-slate-400 mt-2">
              • New animated footer  
              • Smooth framer-motion transitions  
              • Improved dark theme and layout  
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" variants={fade} viewport={{ once: true }}>
            <h3 className="text-xl text-white font-semibold">🔧 Under-the-Hood Improvements</h3>
            <p className="text-slate-400 mt-2">
              • Faster Supabase queries  
              • Optimized components  
              • Cleanup & refactoring  
            </p>
          </motion.div>

        </div>
      </div>
      <SiteFooter />
    </div>
  );
}