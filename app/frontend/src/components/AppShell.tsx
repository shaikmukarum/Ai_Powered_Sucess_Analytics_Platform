import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LoaderCircle, LogOut, Menu, ShieldAlert, Sparkles, Users, X } from "lucide-react";
import HelpCenterModal from "@/components/HelpCenterModal";
import { useAuth } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Students", to: "/students", icon: Users },
  { label: "Risk signals", to: "/risk", icon: ShieldAlert },
];

function Sidebar({ collapsed, onToggle, onClose, onOpenHelp }: { collapsed: boolean; onToggle: () => void; onClose: () => void; onOpenHelp: () => void }) {
  const { user, logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  return <aside data-testid="app-sidebar" className={`relative flex h-full w-[272px] flex-col border-r border-[#c4b5fd]/10 bg-[#12121f]/95 px-4 py-5 backdrop-blur-2xl transition-[width] duration-300 ${collapsed ? "md:w-[82px]" : "md:w-[272px]"}`}>
    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2`}>
      <button data-testid="brand-home-button" onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#c4b5fd]/30 bg-[#c4b5fd]/10 shadow-[0_0_20px_rgba(124,58,237,0.25)]"><Sparkles size={17} className="text-[#c4b5fd]" /></div>
        {!collapsed && <div><p data-testid="brand-name" className="text-sm font-semibold tracking-tight text-[#f5f3ff]">success<span className="text-[#c4b5fd]">.copilot</span></p><p data-testid="brand-caption" className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6e6e85]">student intelligence</p></div>}
      </button>
      <button data-testid="sidebar-close-button" onClick={onClose} className="rounded-lg p-2 text-[#a1a1b5] hover:bg-white/5 hover:text-white md:hidden"><X size={17} /></button>
    </div>
    <div className={`mt-10 flex shrink-0 items-center gap-2 px-2 ${collapsed ? "justify-center" : ""}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#4ade80]" />{!collapsed && <span data-testid="system-status" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e6e85]">system operational</span>}</div>
    <nav data-testid="primary-navigation" className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
      {!collapsed && <p data-testid="nav-workspace-label" className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6e6e85]">Workspace</p>}
      {navItems.map((item) => {
        const Icon = item.icon;
        return <NavLink key={item.label} to={item.to} onClick={onClose} data-testid={`nav-${item.label.replaceAll(" ", "-")}-link`} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${isActive ? "border border-[#c4b5fd]/20 bg-[#c4b5fd]/10 text-[#f5f3ff] shadow-[0_0_22px_rgba(124,58,237,0.12)]" : "text-[#a1a1b5] hover:bg-white/[0.04] hover:text-[#f5f3ff]"} ${collapsed ? "justify-center" : ""}`}><Icon size={17} className="shrink-0" />{!collapsed && <span>{item.label}</span>}</NavLink>;
      })}
      {!collapsed && <p data-testid="nav-support-label" className="mb-3 mt-9 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6e6e85]">Account</p>}
      <button data-testid="nav-help-button" onClick={() => { onClose(); onOpenHelp(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#a1a1b5] transition-colors hover:bg-white/[0.04] hover:text-[#f5f3ff] ${collapsed ? "justify-center" : ""}`}><CircleHelp size={17} />{!collapsed && <span>Help center</span>}</button>
      <button data-testid="nav-sign-out-button" aria-label="Sign out" disabled={isLoggingOut} onClick={() => void logout()} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#a1a1b5] transition-colors hover:bg-rose-300/[0.06] hover:text-rose-200 disabled:cursor-wait disabled:opacity-60 ${collapsed ? "justify-center" : ""}`}>{isLoggingOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} />}{!collapsed && <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>}</button>
    </nav>
    <div data-testid="sidebar-user-card" className={`mt-3 shrink-0 rounded-2xl border border-[#c4b5fd]/10 bg-white/[0.035] p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
      <div className="flex items-center gap-3"><div data-testid="user-avatar" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c4b5fd] to-[#7c3aed] text-xs font-semibold text-[#0b0b14]">{user?.name.split(" ").map((part) => part[0]).join("")}</div>{!collapsed && <div className="min-w-0"><p data-testid="current-user-name" className="truncate text-xs font-medium text-[#f5f3ff]">{user?.name}</p><p data-testid="current-user-role" className="font-mono text-[9px] uppercase tracking-wider text-[#6e6e85]">{user?.role} · {user?.department}</p></div>}</div>
      <button data-testid="logout-button" aria-label="Sign out from user card" disabled={isLoggingOut} onClick={() => void logout()} className={`flex items-center gap-2 rounded-lg text-xs text-[#a1a1b5] transition-colors hover:text-rose-200 disabled:cursor-wait disabled:opacity-60 ${collapsed ? "p-1.5" : "mt-3 w-full px-1 py-1"}`}>{isLoggingOut ? <LoaderCircle size={14} className="animate-spin" /> : <LogOut size={14} />}{!collapsed && <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>}</button>
    </div>
    <button data-testid="sidebar-collapse-button" onClick={onToggle} className="absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-[#c4b5fd]/20 bg-[#171728] text-[#a1a1b5] shadow-lg hover:text-[#f5f3ff] md:flex">{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
  </aside>;
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  // The page scrolls inside <main> now, so jump back to the top when the route changes.
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [location.pathname]);
  return <div data-testid="app-shell" className="flex h-dvh overflow-hidden bg-[#0b0b14] text-[#f5f3ff]">
    {mobileOpen && <button data-testid="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#0b0b14]/70 backdrop-blur-sm md:hidden" aria-label="Close navigation" />}
    <div data-testid="mobile-sidebar-shell" data-open={mobileOpen ? "true" : "false"} className="mobile-sidebar-shell h-full"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} onClose={() => setMobileOpen(false)} onOpenHelp={() => setHelpOpen(true)} /></div>
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Desktop top bar removed. On phones the sidebar is a drawer, so keep a slim bar with the menu button. */}
      <div data-testid="mobile-top-bar" className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[#c4b5fd]/10 bg-[#0b0b14]/85 px-4 backdrop-blur-xl md:hidden"><button data-testid="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#a1a1b5] hover:bg-white/5"><Menu size={18} /></button><p className="text-sm font-semibold tracking-tight text-[#f5f3ff]">success<span className="text-[#c4b5fd]">.copilot</span></p></div>
      <main ref={mainRef} data-testid="main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto"><Outlet /></main>
    </div>
    <HelpCenterModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
  </div>;
}