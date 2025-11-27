// "use client";

// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { LayoutDashboard, FileText, Settings, LogOut ,MessageSquare,Mail } from "lucide-react"; // Icons
// import { supabase } from "@/lib/supabase";
// import { useRouter } from "next/navigation";
// import { Users } from "lucide-react";
// import { CheckSquare,Palette  } from "lucide-react"
// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     router.push("/login");
//   };

//   const navItems = [
//     { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
//     { name: "Proposals", href: "/dashboard/proposals/list", icon: FileText },
//     { name: "Co-Founder Chat", href: "/dashboard/chat", icon: MessageSquare },
//     { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
//     { name: "Branding Suite", href: "/dashboard/branding", icon: Palette },
//     { name: "Brand Settings", href: "/dashboard/settings", icon: Settings },
//     { name: "Email Assistant", href: "/dashboard/emails/list", icon: Mail },
//     { name: "Clients", href: "/dashboard/clients", icon: Users },
    
    
//   ];

//   return (
//     <div className="flex min-h-screen bg-slate-50">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
//         <div className="p-6 border-b border-slate-100">
//           <h1 className="text-2xl font-bold text-slate-900">FoundrKit</h1>
//         </div>
        
//         <nav className="flex-1 p-4 space-y-2">
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
//                   isActive
//                     ? "bg-slate-900 text-white"
//                     : "text-slate-600 hover:bg-slate-100"
//                 }`}
//               >
//                 <Icon size={18} />
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>

//         <div className="p-4 border-t border-slate-100">
//           <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
//             <LogOut size={18} className="mr-2" />
//             Logout
//           </Button>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <main className="flex-1 p-8 overflow-y-auto">
//         {children}
//       </main>
//     </div>
//   );
// }
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
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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

  // Helper component for Nav Links
  const NavLink = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        href={item.href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-slate-900 text-white shadow-md"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon size={18} />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
           <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
           </div>
           <span className="text-xl font-bold text-slate-900">FoundrKit</span>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        {/* Desktop Logout */}
        <div className="p-4 border-t border-slate-100">
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* MOBILE HEADER (Visible only on Mobile) */}
        <header className="md:hidden h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold">F</span>
              </div>
              <span className="font-bold text-lg">FoundrKit</span>
           </div>

           {/* Mobile Menu Trigger */}
           <Sheet open={isOpen} onOpenChange={setIsOpen}>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
                 <Menu size={24} />
               </Button>
             </SheetTrigger>
             
             {/* FIXED: Added 'flex flex-col h-full' so logout stays at bottom */}
             <SheetContent side="left" className="w-64 p-0 flex flex-col h-full">
               <div className="p-6 border-b border-slate-100">
                 <span className="text-xl font-bold text-slate-900">Menu</span>
               </div>
               
               {/* Nav Items take remaining space */}
               <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                 {navItems.map((item) => <NavLink key={item.href} item={item} />)}
               </nav>

               {/* Mobile Logout (Pinned to Bottom) */}
               <div className="p-4 border-t mt-auto">
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut size={18} className="mr-2" /> Logout
                  </Button>
               </div>
             </SheetContent>
           </Sheet>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}