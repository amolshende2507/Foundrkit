//app\about\page.tsx
"use client";

import { SiteFooter } from "@/components/landing/Footer";
import { SiteHeader } from "@/components/landing/Header";
import { motion } from "framer-motion";
import { Sparkles, Target, Rocket, Users, Star, Heart } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* HERO SECTION */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp} className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-linear-to-tr from-purple-500 to-sky-400 shadow-purple-500/40 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white">
            About Us
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Built for solo founders who do everything themselves —
            FoundrKit is your operating system, co-founder, and creative partner.
          </motion.p>
        </motion.div>

        {/* MISSION SECTION */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold text-white mb-4">
            Our Mission
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 leading-relaxed">
            Founders waste too much time on admin, proposals, task planning,
            emails, and switching between tools.
            Our mission is simple:
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-6 p-6 border border-white/10 rounded-2xl bg-slate-900/40 backdrop-blur"
          >
            <p className="text-lg text-slate-100 font-medium">
              “Give solo founders the power of a 5-person team — instantly.”
            </p>
          </motion.div>
        </motion.section>

        {/* TIMELINE SECTION */}
        {/* TIMELINE SECTION */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold text-white mb-8">
            The Journey
          </motion.h2>

          <div className="space-y-10">
            {[
              {
                year: "2025",
                title: "The Beginning",
                desc: "FoundrKit began as a final-year engineering project — a bold idea to create an AI workspace for solo founders.",
              },
              {
                year: "2026",
                title: "The Build Phase",
                desc: "We designed, engineered, refined, and shaped FoundrKit into a complete system—bringing proposals, tasks, clients, and strategic tools together in one unified workspace.",
              },
              {
                year: "2026",
                title: "The Vision Ahead",
                desc: "We aim to continue expanding FoundrKit beyond academia and transform it into a full-fledged platform that empowers real solo founders globally.",
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex gap-6 border-l border-sky-400/40 pl-6"
              >
                <div className="text-sky-300 font-bold text-xl">{item.year}</div>
                <div>
                  <h3 className="text-lg text-white font-semibold">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-20"
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold text-white mb-8">
            What We Believe
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Target, title: "Focus First", text: "We remove distractions so founders can create." },
              { icon: Rocket, title: "Move Fast", text: "Tools should accelerate you — not slow you down." },
              { icon: Users, title: "Solo, Not Alone", text: "You may build alone, but you should feel supported." },
              { icon: Star, title: "Craft Matters", text: "Everything should feel premium, beautiful, and calm." },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-5 rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur"
              >
                <f.icon className="h-6 w-6 text-sky-300 mb-3" />
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FOUNDER NOTE */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="p-6 rounded-2xl bg-linear-to-r from-purple-500/10 to-sky-500/10 border border-white/10 shadow-xl"
        >
          <Heart className="h-6 w-6 text-pink-300 mb-3" />

          <p className="text-slate-300 leading-relaxed">
            FoundrKit is built with care, precision, and deep respect for the solo founder.
            You are doing the work of an entire team — and you deserve tools that amplify you,
            not overwhelm you.
          </p>

          <p className="mt-4 text-slate-400 text-sm">— The FoundrKit Team</p>
        </motion.section>

      </div>
      <SiteFooter />
    </div>
  );
}