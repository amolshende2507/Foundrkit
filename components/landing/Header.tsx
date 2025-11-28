"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Import your supabase helper
import { useRouter } from "next/navigation";

export function SiteHeader() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<any>(null); // Track user state
    const router = useRouter();

    // 1. Check if user is logged in on mount
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, []);

    // 2. Handle Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.refresh(); // Refresh page to update state
        router.push("/"); // Ensure they stay on landing page
    };

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-black/20"
        >
            {/* Floating glow behind header */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-20 top-0 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute right-20 top-0 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
            </div>

            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-purple-500 to-sky-400 shadow-lg shadow-purple-500/40">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>

                        <span className="text-lg font-semibold tracking-tight text-white">
                            FoundrKit
                        </span>
                    </motion.div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                    <a href="#how" className="hover:text-white opacity-70 transition">How it works</a>
                    <a href="#features" className="hover:text-white opacity-70 transition">Features</a>
                    <a href="#why" className="hover:text-white opacity-70 transition">For solo founders</a>
                </nav>

                {/* --- DESKTOP BUTTONS LOGIC --- */}
                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        // STATE: LOGGED IN
                        <>
                            <Button variant="ghost" onClick={handleLogout} className="text-slate-200 hover:text-red-400 hover:bg-white/5">
                                <LogOut className="mr-2 h-4 w-4" /> Log out
                            </Button>
                            <Link href="/dashboard">
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Button className="bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold shadow-lg hover:opacity-90">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                                    </Button>
                                </motion.div>
                            </Link>
                        </>
                    ) : (
                        // STATE: LOGGED OUT
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-200 hover:text-white hover:bg-white/5">
                                    Log in
                                </Button>
                            </Link>
                            <Link href="/login">
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Button className="bg-linear-to-r from-purple-500 to-sky-400 text-slate-950 font-semibold shadow-lg shadow-purple-500/40 hover:opacity-90">
                                        Get started
                                        <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-slate-200"
                    onClick={() => setOpen(!open)}
                >
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* --- MOBILE NAVIGATION --- */}
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden border-t border-white/10 bg-black/30 backdrop-blur-xl px-6 py-4 space-y-4"
                >
                    <a href="#how" className="block text-slate-200">How it works</a>
                    <a href="#features" className="block text-slate-200">Features</a>
                    <a href="#why" className="block text-slate-200">For solo founders</a>

                    <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                        {user ? (
                            // MOBILE LOGGED IN
                            <>
                                <Link href="/dashboard">
                                    <Button className="w-full bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
                                    </Button>
                                </Link>
                                <Button variant="ghost" onClick={handleLogout} className="w-full text-red-400 hover:bg-white/5 justify-start">
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </Button>
                            </>
                        ) : (
                            // MOBILE LOGGED OUT
                            <>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full border-white/20 text-slate-200 bg-transparent hover:bg-white/10">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button className="w-full bg-linear-to-r from-purple-500 to-sky-400 text-slate-950">
                                        Get started free
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.header>
    );
}