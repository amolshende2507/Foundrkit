"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const pricingPlans = [
    {
        name: "Starter",
        price: "$0",
        period: "/month",
        description: "Perfect for exploring the AI tools.",
        features: ["5 AI Proposals / mo", "Basic Task Board", "Standard Support", "1 Client Profile"],
        cta: "Start Free",
        popular: false,
    },
    {
        name: "Pro Founder",
        price: "$29",
        period: "/month",
        description: "For founders running a serious operation.",
        features: ["Unlimited Proposals", "Advanced Co-Founder Chat", "Priority Support", "Unlimited Clients", "Export to PDF"],
        cta: "Get Pro",
        popular: true,
    },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="mt-32 px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl text-white">Simple pricing for solo founders.</h2>
            <p className="mt-4 text-slate-400">Start for free, upgrade when you scale.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
                <motion.div 
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`relative rounded-3xl border p-8 flex flex-col ${
                        plan.popular 
                        ? "border-purple-500/50 bg-slate-900/80 shadow-2xl shadow-purple-900/20" 
                        : "border-white/10 bg-slate-950/50"
                    }`}
                >
                    {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-sky-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
                            MOST POPULAR
                        </div>
                    )}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-slate-200">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="ml-1 text-slate-500">{plan.period}</span>
                        </div>
                        <p className="mt-4 text-sm text-slate-400">{plan.description}</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feat) => (
                            <li key={feat} className="flex items-center gap-3 text-sm text-slate-300">
                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <span className="text-emerald-400 text-xs">✓</span>
                                </div>
                                {feat}
                            </li>
                        ))}
                    </ul>
                    <Link href="/login" className="w-full">
                        <Button className={`w-full h-12 rounded-xl font-semibold ${
                            plan.popular 
                            ? "bg-gradient-to-r from-purple-500 to-sky-400 text-slate-950 hover:opacity-90" 
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}>
                            {plan.cta}
                        </Button>
                    </Link>
                </motion.div>
            ))}
        </div>
    </section>
  );
};