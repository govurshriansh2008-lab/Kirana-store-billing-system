import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Users, BookOpen,
  BarChart3, Tag, Sticker, Settings, Sun, Moon, LogOut, Store, ClipboardList, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/items", label: "Items & Stock", icon: Package },
  { path: "/stock-entry", label: "Stock Entry", icon: ClipboardList },
  { path: "/billing", label: "Billing / POS", icon: ShoppingCart },
  { path: "/bills", label: "Bills History", icon: FileText },
  { path: "/vendors", label: "Vendors", icon: Users },
  { path: "/credit-customers", label: "Credit (Katha)", icon: BookOpen },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/offers", label: "Offers", icon: Tag },
  { path: "/stickers", label: "Stickers", icon: Sticker },
  { path: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavClick, lightMode, setLightMode }) {
  const location = useLocation();
  return (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">kirana shop billing system</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => setLightMode(!lightMode)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {lightMode ? "Dark Mode" : "Light Mode"}
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [lightMode, setLightMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", lightMode);
  }, [lightMode]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col z-50">
        <SidebarContent lightMode={lightMode} setLightMode={setLightMode} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground">kirana shop billing system</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-sidebar border-r border-sidebar-border h-full z-10">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <span className="text-sm font-bold text-sidebar-foreground">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <SidebarContent
                onNavClick={() => setMobileOpen(false)}
                lightMode={lightMode}
                setLightMode={setLightMode}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}