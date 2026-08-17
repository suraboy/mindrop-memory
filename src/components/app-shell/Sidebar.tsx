"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Inbox,
  Bookmark,
  Layers,
  Settings,
  Search,
  Command,
} from "lucide-react";
import { MOCK_TOPICS } from "@/lib/mock-data/captures";
import { useMINDROP } from "@/context/MINDROPContext";

export function Sidebar() {
  const pathname = usePathname();
  const { setCommandOpen, selectedTopicFilter, setSelectedTopicFilter } = useMINDROP();

  const navItems = [
    { href: "/", label: "Today", icon: Sparkles, badge: null },
    { href: "/inbox", label: "Inbox", icon: Inbox, badge: "3" },
    { href: "/library", label: "Library", icon: Bookmark, badge: null },
    { href: "/ask", label: "Ask", icon: Layers, badge: "AI" },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md p-4 shrink-0 h-screen sticky top-0">
      {/* Brand & Search */}
      <div className="space-y-4">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs shadow-xs">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                MINDROP
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider">
                PERSONAL INTELLIGENCE
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Shortcut Button */}
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" />
            <span>Search memory...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Main Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
              AI Topics
            </span>
            <span className="text-[10px] text-zinc-400">Auto-clustered</span>
          </div>

          <div className="space-y-0.5">
            {MOCK_TOPICS.map((topic) => {
              const isFiltered = selectedTopicFilter === topic.name;
              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopicFilter(isFiltered ? null : topic.name);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    isFiltered
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate">{topic.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {topic.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / LINE Sync status & Settings */}
      <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* LINE Capture Banner */}
        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 truncate">
              LINE Bot Active
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 truncate">
              Drop anything to @mindrop
            </div>
          </div>
        </div>

        {/* Settings link */}
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
