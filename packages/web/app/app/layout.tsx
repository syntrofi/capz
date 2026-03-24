"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Nav } from "@/components/nav";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, Settings, ChevronRight } from "lucide-react";

const sidebarLinks = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/setup", label: "New Account", icon: PlusCircle, exact: false },
  { href: "/app/settings", label: "Settings", icon: Settings, exact: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, status } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "disconnected") {
      router.push("/");
    }
  }, [status, router]);

  // Show spinner while wagmi reconnects on page load
  if (status === "reconnecting" || status === "connecting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isConnected) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border/50 bg-card/20 pt-6 pb-8 px-3 shrink-0">
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/50 bg-background/95 backdrop-blur-sm">
          {sidebarLinks.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
