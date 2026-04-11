// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
  Users,
  Mail,
  CheckSquare,
  Palette,
  Menu,
  Wrench,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";

// ✅ Type for nav items
type NavItem = {
  name: string;
  href: string;
  icon: any;
};

// ✅ Move outside component (performance)
const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proposals", href: "/dashboard/proposals/list", icon: FileText },
  { name: "Client CRM", href: "/dashboard/clients", icon: Users },
  { name: "Email Assistant", href: "/dashboard/emails/list", icon: Mail },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Co-Founder Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Branding Suite", href: "/dashboard/branding", icon: Palette },
  { name: "AI Tools", href: "/dashboard/tools", icon: Wrench },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Improved logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Typed NavLink
  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;

    const isActive =
      pathname === item.href ||
      pathname.startsWith(item.href + "/");

    return (
      <Link
        href={item.href}
        onClick={() => setIsOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300
          ${
            isActive
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 hover:scale-[1.01]"
          }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full"></div>
        )}

        <Icon
          size={18}
          className={`transition-transform group-hover:rotate-3 
          ${isActive ? "text-white" : "text-slate-700 dark:text-slate-300"}`}
        />

        <span
          className={`tracking-wide 
          ${isActive ? "text-white" : "text-slate-700 dark:text-slate-300"}`}
        >
          {item.name}
        </span>

        {!isActive && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition border border-slate-200 dark:border-slate-700"></div>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black transition-colors duration-300">

      {/* SIDEBAR */}
      <aside
        className="hidden md:flex w-72 flex-col fixed inset-y-0 z-40
        bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl 
        border-r border-slate-200 dark:border-slate-800 shadow-xl transition-colors"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              FoundrKit
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Startup OS
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Button
            variant="ghost"
            aria-label="Logout"
            disabled={loading}
            className="flex-1 justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            {loading ? "Logging out..." : "Logout"}
          </Button>

          <div
            className="relative group rounded-xl p-2 cursor-pointer
             bg-slate-200/50 dark:bg-slate-800/50 
             hover:bg-gradient-to-tr hover:from-blue-600 hover:to-indigo-600
             transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                  bg-gradient-to-r from-indigo-500 to-blue-600 blur-md 
                  transition-all duration-500"></div>

            <div className="relative z-10 flex items-center justify-center">
              <ModeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header
          className="md:hidden h-16 sticky top-0 z-40 
          bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl 
          border-b border-slate-200 dark:border-slate-800 
          shadow-sm flex items-center justify-between px-4 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">
              FoundrKit
            </span>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-72 p-0 flex flex-col h-full 
              bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl 
              border-r border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                  Menu
                </h2>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <Button
                  variant="ghost"
                  disabled={loading}
                  className="flex-1 justify-start text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  {loading ? "Logging out..." : "Logout"}
                </Button>

                <ModeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}