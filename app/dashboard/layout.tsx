import { LayoutDashboard, Users, BarChart2, BookOpen, CalendarDays, LogOut, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/dashboard",           label: "Overzicht",  icon: LayoutDashboard },
  { href: "/dashboard/leads",     label: "Leads",      icon: Users },
  { href: "/dashboard/chats",     label: "Chats",      icon: MessageCircle },
  { href: "/dashboard/blogs",     label: "Blog",       icon: BookOpen },
  { href: "/dashboard/content",   label: "Content",    icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics",  icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0a1a22]">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#0f2027] border-r border-white/5 flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#00D4AA] mb-0.5">Portal</p>
          <p className="text-lg font-extrabold text-white leading-tight">
            Mind<span className="text-[#00D4AA]">Build</span>
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </a>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/5">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0f2027] border-b border-white/5">
          <div>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#00D4AA] leading-none mb-0.5">Portal</p>
            <p className="text-base font-extrabold text-white leading-none">
              Mind<span className="text-[#00D4AA]">Build</span>
            </p>
          </div>
          <a href="/api/auth/logout" className="p-2 text-white/40 hover:text-white/70 transition-colors">
            <LogOut className="w-4 h-4" />
          </a>
        </div>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-[#0f2027] border-t border-white/5 px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-white/50 hover:text-[#00D4AA] transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
