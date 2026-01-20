"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, LineChart, Users, Brain, Clock } from "lucide-react";
import { SiteHeader } from "@/components/landing/Header"; // Import Component
import { SiteFooter } from "@/components/landing/Footer"; // Import Component
// <--- Import this
import { FAQ } from "@/components/landing/FAQ"; 
import { Pricing } from "@/components/landing/Pricing";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const features = [
    { icon: Brain, title: "AI Co-Founder Chat", text: "Ask strategy questions, validate ideas, and get action plans tailored to your business.", pill: "Strategy" },
    { icon: LineChart, title: "Proposals that Win", text: "Draft high-converting proposals in minutes with your brand voice baked in.", pill: "Revenue" },
    { icon: Clock, title: "Task Brain Offload", text: "Turn messy ideas into organized tasks, priorities, and timelines automatically.", pill: "Productivity" },
    { icon: Users, title: "Clients in One HQ", text: "Keep clients, emails, and deals in a focused workspace built for solo founders.", pill: "Clients" },
];

const steps = [
    { step: "01", title: "Describe your business once", text: "FoundrKit learns your brand, offers, and tone so every proposal, email, and answer fits you." },
    { step: "02", title: "Let the AI Co-Founder handle the busywork", text: "It drafts proposals, outreach emails, task plans, and more—while you focus on building." },
    { step: "03", title: "Run your day from one dashboard", text: "See proposals, tasks, clients, and insights in a single view built for momentum." },
];

const pricingPlans = [
    {
        name: "Starter",
        price: "0",
        period: "/month",
        description: "Perfect for exploring the AI tools.",
        features: ["5 AI Proposals / mo", "Basic Task Board", "Standard Support", "1 Client Profile"],
        cta: "Start Free",
        popular: false,
    },
    {
        name: "Pro Founder",
        price: "29",
        period: "/month",
        description: "For founders running a serious operation.",
        features: ["Unlimited Proposals", "Advanced Co-Founder Chat", "Priority Support", "Unlimited Clients", "Export to PDF"],
        cta: "Get Pro",
        popular: true,
    },
];

const faqs = [
    {
        q: "Is my business data private?",
        a: "100%. Your brand strategy, client notes, and proposals are encrypted and only accessible by you. We do not use your data to train public models.",
    },
    {
        q: "Can I export documents?",
        a: "Yes! You can export proposals as professional PDFs and copy email drafts directly to your clipboard.",
    },
    {
        q: "Does it work on mobile?",
        a: "Absolutely. FoundrKit is fully responsive, so you can manage tasks and chat with your AI co-founder on the go.",
    },
    {
        q: "What AI model do you use?",
        a: "We leverage advanced LLMs (like Gemini/GPT-4) tuned specifically for business logic, strategy, and professional writing.",
    },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden font-sans">
            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-32 -right-16 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl opacity-50" />
                <div className="absolute top-64 -left-20 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl opacity-30" />
            </div>

            <div className="relative z-10">
                {/* USE THE REUSABLE HEADER COMPONENT */}
                <SiteHeader />

                {/* HERO SECTION */}
                <main className="mx-auto max-w-6xl px-4 pb-24 pt-16 lg:px-6 lg:pt-24">
                    <motion.section
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center"
                    >
                        {/* Left side */}
                        <motion.div variants={fadeUp} className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Built for solo founders who do everything.
                            </div>

                            <motion.h1 variants={fadeUp} className="text-4xl font-semibold sm:text-5xl lg:text-6xl tracking-tight">
                                Your{" "}
                                <span className="bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                                    AI Co-Founder
                                </span>{" "}
                                for everything outside your zone of genius
                            </motion.h1>

                            <motion.p variants={fadeUp} className="max-w-xl text-slate-300 text-lg leading-relaxed">
                                FoundrKit helps you run proposals, tasks, strategy, branding,
                                email, and clients from one dashboard—while AI does the thinking.
                            </motion.p>

                            <motion.div variants={fadeUp} className="flex gap-3 flex-wrap pt-2">
                                <Link href="/login">
                                    <Button className="h-12 rounded-full bg-gradient-to-r from-purple-500 to-sky-400 text-slate-950 font-bold px-8 shadow-lg hover:opacity-90 transition-all text-base">
                                        Start in 60 seconds
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/dashboard">
                                    <Button variant="outline" className="h-12 rounded-full border-white/20 bg-transparent text-slate-100 px-8 hover:bg-white/10 text-base">
                                        View product UI
                                    </Button>
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Right preview card */}
                        <motion.div
                            variants={fadeUp}
                            className="relative hidden lg:block"
                            whileHover={{ rotateX: 6, rotateY: -6 }}
                            transition={{ type: "spring", stiffness: 120, damping: 12 }}
                        >
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-purple-500/40 via-sky-400/40 to-emerald-300/40 blur-3xl opacity-60" />
                            <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Today’s cockpit</p>
                                        <p className="text-sm text-slate-200 font-semibold">Welcome back, Founder.</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/20">Focus Mode</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricCard label="Proposals" value="3" accent="from-sky-400 to-purple-500" />
                                    <MetricCard label="Clients" value="7" accent="from-emerald-400 to-sky-400" />
                                    <MetricCard label="Active Tasks" value="12" accent="from-amber-400 to-orange-500" />
                                    <MetricCard label="Focus Score" value="87%" accent="from-fuchsia-400 to-purple-500" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>

                    {/* FEATURES SECTION */}
                    <motion.section id="features" className="mt-32 space-y-12" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
                        <div className="flex justify-between items-end flex-wrap gap-4">
                            <div>
                                <h2 className="text-3xl font-bold sm:text-4xl">One HQ for your entire founder brain.</h2>
                                <p className="mt-3 max-w-xl text-slate-400 text-lg">Replace scattered tools with one system where everything works together.</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {features.map((f) => (
                                <motion.div key={f.title} variants={fadeUp} className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 hover:border-white/20 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                                            <f.icon className="h-6 w-6 text-sky-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{f.title}</h3>
                                            <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">{f.pill}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed">{f.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                     <div className="relative">
                        {/* Extra glow just for pricing */}
                        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px] -z-10" />
                        
                        <Pricing />
                    </div>
                    <FAQ />

                    {/* CTA FOOTER */}
                    <motion.section className="mt-32 pt-16 relative" variants={fadeUp} initial="hidden" whileInView="show">
                        <div className="rounded-3xl bg-gradient-to-r from-purple-900/40 to-sky-900/40 border border-white/10 p-12 text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-4">Ready to build your empire?</h3>
                                <p className="text-slate-300 mb-8 max-w-lg mx-auto">Join solo founders who are shipping faster, selling more, and stressing less.</p>
                                <Link href="/login">
                                    <Button className="h-12 rounded-full bg-white text-slate-950 font-bold px-8 hover:bg-slate-200">
                                        Start Your HQ Free
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.section>
                </main>
                
                {/* USE THE REUSABLE FOOTER */}
                <SiteFooter />
            </div>
        </div>
    );
}

/* Metric Card Component */
type MetricCardProps = { label: string; value: string; accent: string; };
function MetricCard({ label, value, accent }: MetricCardProps) {
    return (
        <motion.div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4" whileHover={{ y: -4, scale: 1.02 }}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            <div className={`mt-3 h-1.5 w-full rounded-full bg-gradient-to-r ${accent}`} />
        </motion.div>
    );
}
