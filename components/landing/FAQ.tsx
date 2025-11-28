"use client";

import { motion } from "framer-motion";

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

export const FAQ = () => {
  return (
    <section className="mt-32 max-w-3xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
            {faqs.map((faq, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                >
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{faq.q}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
            ))}
        </div>
    </section>
  );
};