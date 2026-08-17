"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Inbox, Bookmark, Layers, Search } from "lucide-react";
import { useMINDROP } from "@/context/MINDROPContext";

export function MobileNav() {
  const pathname = usePathname();
  const { setCommandOpen } = useMINDROP();

  const navItems = [
    { href: "/", label: "Today", icon: Sparkles },
    { href: "/inbox", label: "Inbox", icon: Inbox },
    { href: "/library", label: "Library", icon: Bookmark },
    { href: "/ask", label: "Ask", icon: Layers },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs">
            M
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            MINDROP
          </span>
        </Link>

        <button
          onClick={() => setCommandOpen(true)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-200/80 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
