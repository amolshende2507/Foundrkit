"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, FileText, Settings, MessageSquare, Users, Mail, CheckSquare, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proposals", href: "/dashboard/proposals/list", icon: FileText },
    { name: "Clients", href: "/dashboard/clients", icon: Users },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Email Assistant", href: "/dashboard/emails/list", icon: Mail },
    { name: "Co-Founder Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Branding Suite", href: "/dashboard/branding", icon: Palette },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col gap-4 mt-8">
            <div className="px-2 mb-4">
                <h1 className="text-xl font-bold text-slate-900">FoundrKit</h1>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)} // Close menu when clicked
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <Icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}