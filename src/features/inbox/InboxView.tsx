"use client";

import React, { useState } from "react";
import { useMINDROP } from "@/context/MINDROPContext";
import { CaptureCard } from "@/components/capture/CaptureCard";
import {
  Inbox,
  Image as ImageIcon,
  Link2,
  FileText,
  Layers,
  Send,
  RefreshCw,
} from "lucide-react";
import { CaptureType } from "@/types";

export function InboxView() {
  const { captures, refreshCaptures } = useMINDROP();
  const [activeFilter, setActiveFilter] = useState<"all" | CaptureType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCaptures();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filterTabs: { id: "all" | CaptureType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: "All", icon: Layers },
    { id: "image", label: "Images", icon: ImageIcon },
    { id: "link", label: "Links", icon: Link2 },
    { id: "text", label: "Text", icon: FileText },
    { id: "file", label: "Files", icon: FileText },
  ];

  const filteredCaptures = activeFilter === "all"
    ? captures
    : captures.filter((c) => c.type === activeFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            <Inbox className="w-4 h-4 text-emerald-500" />
            <span>Raw Ingestion Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inbox
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Everything you&apos;ve dropped into MINDROP. AI handles the organization.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200/60 dark:border-zinc-800"
          title="Sync latest captures"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          <span>Sync</span>
        </button>
      </header>

      {/* Capture Input Simulation Banner */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              LINE Gateway Live
            </div>
            <div className="text-zinc-500">
              Drop screenshots, URLs, voice notes or thoughts to LINE bot anytime.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync (4s)
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200/80 dark:border-zinc-800">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          const count =
            tab.id === "all"
              ? captures.length
              : captures.filter((c) => c.type === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono ${
                  isActive ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Captured Items List */}
      {filteredCaptures.length > 0 ? (
        <div className="space-y-3">
          {filteredCaptures.map((item) => (
            <CaptureCard key={item.id} item={item} variant="inbox" />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Nothing waiting here.
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Send a screenshot, link or thought to your LINE bot. MINDROP will take it from there.
          </p>
        </div>
      )}
    </div>
  );
}
