"use client";

import { SiteFooter } from "@/components/landing/Footer";
import { SiteHeader } from "@/components/landing/Header";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Database, Mail, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.15 } },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* HEADER */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-linear-to-tr from-purple-500 to-sky-400 shadow-lg shadow-purple-500/40 flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white">
            Privacy Policy
          </motion.h1>

          <motion.p variants={fadeUp} className="text-slate-400 mt-3">
            Transparency, trust, and security — at the heart of FoundrKit.
          </motion.p>

          <motion.p variants={fadeUp} className="text-slate-500 text-sm mt-1">
            Updated {new Date().getFullYear()}
          </motion.p>
        </motion.div>

        {/* SECTION 1 — OUR PROMISE */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mb-20"
        >
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 shadow-xl backdrop-blur">
            <h2 className="text-2xl font-semibold text-white mb-4">Our Promise to You</h2>
            <p className="text-slate-300 leading-relaxed">
              FoundrKit was built for solopreneurs who value privacy, security, and control.
              We do not sell your data. We do not track you across the internet. And we
              never access your workspace unless you explicitly allow it for support reasons.
            </p>
          </div>
        </motion.section>

        {/* SECTION 2 — WHAT WE COLLECT */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold text-white mb-8">
            What Information We Collect
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Eye,
                title: "Account Information",
                text: "Your email, authentication details, and optional profile data.",
              },
              {
                icon: Database,
                title: "Workspace Data",
                text: "Clients, tasks, proposals — all stored securely and only accessible by you.",
              },
              {
                icon: Lock,
                title: "Security Metadata",
                text: "Login history, device details, and session tokens for protection.",
              },
              {
                icon: Sparkles,
                title: "AI Enhancements",
                text: "We analyze patterns inside your workspace to make your workflow smarter — never shared outside.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-6 rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur"
              >
                <item.icon className="h-6 w-6 text-sky-300 mb-3" />
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SECTION 3 — HOW WE USE IT */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-20"
        >
          <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Data</h2>

          <div className="space-y-4">
            {[
              "To provide the core functionality of FoundrKit",
              "To keep your account secure and authenticated",
              "To improve performance, speed, and accuracy",
              "To generate AI-powered outputs based only on your workspace",
              "To send important updates or security alerts",
            ].map((line, i) => (
              <p key={i} className="text-slate-400 text-sm">
                • {line}
              </p>
            ))}
          </div>
        </motion.section>

        {/* SECTION 4 — CONTACT */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="p-6 rounded-2xl bg-linear-to-r from-purple-500/10 to-sky-500/10 border border-white/10 shadow-lg"
        >
          <Mail className="h-5 w-5 text-sky-300 mb-2" />
          <h3 className="font-semibold text-white mb-2">Questions?</h3>
          <p className="text-slate-400 text-sm">
            Contact us anytime at <span className="text-sky-400">support@foundrkit.ai</span>.
          </p>
        </motion.section>
      </div>
      <SiteFooter />
    </div>
  );
}