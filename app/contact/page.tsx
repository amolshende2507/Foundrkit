"use client";

import { Mail, Phone, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/landing/Header"; // Import Header
import { SiteFooter } from "@/components/landing/Footer"; // Import Footer

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setTimeout(() => router.push("/"), 2500);
  };

  return (
    <div className="bg-[#020617] min-h-screen flex flex-col">
      <SiteHeader /> {/* Add Navbar */}
      
      <div className="flex-1 flex items-center justify-center px-6 py-20 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Contact Support</h2>
          <p className="text-slate-300 mb-6">
            We're here to help! Reach us through email or phone, or drop your message below.
          </p>

          <div className="space-y-3 mb-6 text-sm">
            <p className="flex items-center gap-3"><Mail size={18} /> support@foundrkit.ai</p>
            <p className="flex items-center gap-3"><Phone size={18} /> +91 98765 43210</p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-4 py-3 text-sm"
            >
              ✅ Message delivered successfully! Redirecting…
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input type="text" placeholder="Full Name" required className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition" />
            <input type="email" placeholder="Email" required className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition" />
            <textarea placeholder="Your Message" rows={4} required className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition"></textarea>

            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-sky-400 text-slate-900 font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition">
              Send Message <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>

      <SiteFooter /> {/* Add Footer */}
    </div>
  );
}