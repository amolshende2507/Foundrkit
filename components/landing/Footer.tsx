"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight, Sparkles } from "lucide-react";

const footerContainer = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const columnsStagger = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, staggerChildren: 0.12 },
  },
};

const columnItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const SiteFooter = () => {
  return (
    <footer className="bg-[#020617] border-t border-white/10 pt-16 pb-10 text-slate-300">
      <div className="max-w-7xl mx-auto px-6">

        {/* TOP SECTION */}
        <motion.div
          variants={columnsStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-12"
        >

          {/* BRAND — LEFT */}
          <motion.div variants={columnItem}>
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-linear-to-tr from-purple-500 to-sky-400 shadow-lg shadow-purple-500/40"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-xl font-semibold text-white">FoundrKit</span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              The complete AI workspace for solo founders.
              Proposals, clients, tasks, strategy, and branding — all in one place.
            </p>
          </motion.div>

          {/* COMPANY — MIDDLE */}
          <motion.div variants={columnItem} className="sm:mx-auto">
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-white transition">About Us</a></li>
              <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="/changelog" className="hover:text-white transition">Changelog</a></li>
            </ul>
          </motion.div>
          

          {/* CONTACT — RIGHT */}
          <motion.div variants={columnItem} className="sm:ml-auto">
            <h3 className="text-sm font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">

              <li className="flex gap-3 items-start">
                <Phone className="h-4 w-4 text-sky-400 mt-1" />
                <span>+91 98765 43210</span>
              </li>

              <li className="flex gap-3 items-start">
                <Mail className="h-4 w-4 text-sky-400 mt-1" />
                <span>support@foundrkit.ai</span>
              </li>

              <li className="flex gap-3 items-start">
                <MapPin className="h-4 w-4 text-sky-400 mt-1" />
                <span>
                  FoundrKit HQ <br />
                  Pune, Maharashtra <br />
                  India
                </span>
              </li>

              <li>
                <motion.div whileHover={{ x: 2 }}>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-sky-300 hover:text-white transition"
                  >
                    Contact Support <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </li>

            </ul>
          </motion.div>
        </motion.div>

        {/* COPYRIGHT ROW */}
        <motion.div
          variants={footerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500"
        >
          <span>© {new Date().getFullYear()} FoundrKit. All rights reserved.</span>
          <span>Built for solo founders who refuse to play small.</span>
        </motion.div>

      </div>
    </footer>
  );
};