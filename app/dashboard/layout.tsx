import { LayoutDashboard, Users, BarChart2, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0a1a22]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0f2027] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#00D4AA] mb-0.5">Portal</p>
          <p className="text-lg font-extrabold text-white leading-tight">
            Mind<span className="text-[#00D4AA]">Build</span>
          </p>
        </div>

        {/* Nav */}
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

        {/* Logout */}
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
