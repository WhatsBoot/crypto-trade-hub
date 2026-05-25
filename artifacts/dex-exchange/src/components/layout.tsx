import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { LayoutDashboard, LineChart, ArrowLeftRight, Repeat, Wallet, History, Shield, LogOut, Loader2, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/trade", label: "Trade", icon: ArrowLeftRight },
  { href: "/swap", label: "Swap", icon: Repeat },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "History", icon: History },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();
  
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && isError) {
      setToken(null);
      setLocation("/login");
    }
  }, [isLoading, isError, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  const adminNav = user.role === 'admin' ? [{ href: "/admin", label: "Admin", icon: Shield }] : [];
  const allNavItems = [...NAV_ITEMS, ...adminNav];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        setToken(null);
        setLocation("/login");
      }
    });
  };

  const NavLinks = () => (
    <>
      {allNavItems.map(item => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={location === item.href ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 mb-1"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold font-mono tracking-tighter text-primary">NEXA<span className="text-foreground">DEX</span></h1>
        </div>
        <nav className="flex-1 px-4 py-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Bottom Nav */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="text-xl font-bold font-mono text-primary">NEXA<span className="text-foreground">DEX</span></h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-card p-0 flex flex-col">
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-bold font-mono tracking-tighter text-primary">NEXA<span className="text-foreground">DEX</span></h1>
            </div>
            <nav className="flex-1 px-4 py-6">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around p-2 pb-safe">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="icon"
              className={location === item.href ? "text-primary" : "text-muted-foreground"}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}
