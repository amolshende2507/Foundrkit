"use client";

import { SiteFooter } from "@/components/landing/Footer";
import { SiteHeader } from "@/components/landing/Header";
import { motion } from "framer-motion";
import { Scale, ShieldCheck, FileCheck, Globe } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.15 } },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-6 py-20">

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fade} className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-linear-to-tr from-sky-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
              <Scale className="h-7 w-7 text-white" />
            </div>
          </motion.div>

          <motion.h1 variants={fade} className="text-4xl sm:text-5xl font-bold text-white">
            Terms & Conditions
          </motion.h1>

          <motion.p variants={fade} className="text-slate-400 mt-3">
            Clear, simple, and fair — just like the tools we build.
          </motion.p>
        </motion.div>

        {/* INTRO */}
        <motion.section
          initial="hidden"
          whileInView="show"
          variants={fade}
          className="mb-20 p-6 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur"
        >
          <p className="text-slate-300 leading-relaxed">
            These Terms & Conditions outline your rights, responsibilities, and the rules governing
            your use of FoundrKit. By creating an account, you agree to abide by these terms.
          </p>
        </motion.section>

        {/* TERMS BLOCKS */}
        <motion.section
          initial="hidden"
          whileInView="show"
          variants={stagger}
          className="grid sm:grid-cols-2 gap-6 mb-20"
        >
          {[
            {
              icon: ShieldCheck,
              title: "Account Responsibility",
              desc: "You must keep your password secure and notify us if you suspect any unauthorized access.",
            },
            {
              icon: FileCheck,
              title: "Acceptable Use",
              desc: "You agree not to misuse FoundrKit, break laws, or harm the platform.",
            },
            {
              icon: Globe,
              title: "Intellectual Property",
              desc: "All branding, design, and systems within FoundrKit belong to the development team.",
            },
            {
              icon: Scale,
              title: "Fair Usage",
              desc: "We reserve the right to prevent abusive or automated misuse of FoundrKit.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fade}
              className="p-6 rounded-xl bg-slate-900/40 border border-white/10"
            >
              <item.icon className="h-6 w-6 text-sky-300 mb-3" />
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* AGREEMENT */}
        <motion.section
          initial="hidden"
          whileInView="show"
          variants={fade}
          className="p-6 rounded-2xl bg-linear-to-r from-purple-500/10 to-sky-500/10 border border-white/10 shadow-lg"
        >
          <h3 className="font-semibold text-white mb-2">Your Agreement</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            By continuing to use FoundrKit, you acknowledge and agree to these terms. If you do not
            agree, you may discontinue use at any time.
          </p>
        </motion.section>

      </div>
      <SiteFooter />
    </div>
  );
}