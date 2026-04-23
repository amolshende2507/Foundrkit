"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, FileText, Settings, LogOut, MessageSquare, 
  Users, Mail, CheckSquare, Palette, Menu, Wrench, ChevronLeft, ChevronRight
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state

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
    { name: "AI Tools", href: "/dashboard/tools", icon: Wrench },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const NavLink = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        href={item.href}
        onClick={() => setIsOpen(false)}
        title={isCollapsed ? item.name : ""}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
          ${isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
      >
        <Icon size={20} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} />
        {!isCollapsed && <span className="tracking-wide">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "gap-3"} border-b border-slate-200 dark:border-slate-800`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold">F</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">FoundrKit</h1>
              <p className="text-xs text-slate-500">Startup OS</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <Button
              variant="ghost"
              className={`w-full flex ${isCollapsed ? "justify-center px-0" : "justify-start gap-2"} text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}
              onClick={handleLogout}
            >
              <LogOut size={20} />
              {!isCollapsed && "Logout"}
            </Button>
            
            <div className="flex items-center gap-2">
                <div className="flex-1 flex justify-center"><ModeToggle /></div>
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </Button>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-72"}`}>
        <header className="md:hidden h-16 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
          <span className="font-bold">FoundrKit</span>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72">
                <nav className="space-y-2 pt-6">
                    {navItems.map((item) => <NavLink key={item.href} item={item} />)}
                </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}