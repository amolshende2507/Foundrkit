"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, FileText, Settings, LogOut,
  MessageSquare, Users, Mail, CheckSquare, Palette, Menu
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proposals", href: "/dashboard/proposals/list", icon: FileText },
    { name: "Client CRM", href: "/dashboard/clients", icon: Users },
    { name: "Email Assistant", href: "/dashboard/emails/list", icon: Mail },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Co-Founder Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Branding Suite", href: "/dashboard/branding", icon: Palette },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const NavLink = ({ item }: any) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        href={item.href}
        onClick={() => setIsOpen(false)}
        className={`group relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]"
            : "text-slate-600 hover:bg-slate-100 hover:scale-[1.01]"
        }`}
      >
        <Icon size={18} className="group-hover:rotate-3 transition-transform" />
        <span className="tracking-wide">{item.name}</span>
        {!isActive && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition border border-slate-200"></div>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-40 
        bg-white/70 backdrop-blur-xl border-r border-slate-200 shadow-xl">

        {/* LOGO */}
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">FoundrKit</h1>
            <p className="text-xs text-slate-500">Startup OS</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:scale-[1.01] transition"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">

        {/* MOBILE HEADER */}
        <header className="md:hidden h-16 sticky top-0 z-40 
          bg-white/60 backdrop-blur-xl border-b shadow-sm flex items-center justify-between px-4">

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="font-bold tracking-tight">FoundrKit</span>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-white/80 backdrop-blur-xl">
              <div className="p-6 border-b">
                <h2 className="font-bold text-xl">Menu</h2>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => <NavLink key={item.href} item={item} />)}
              </nav>

              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-2" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
