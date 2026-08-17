"use client";

import React from "react";
import { Sparkles, ArrowRight, TrendingUp, X, Inbox } from "lucide-react";
import { useMINDROP } from "@/context/MINDROPContext";
import { CaptureCard } from "@/components/capture/CaptureCard";
import Link from "next/link";

export function TodayView() {
  const { captures, setCommandOpen, selectedTopicFilter, setSelectedTopicFilter } = useMINDROP();

  // Filter if topic selected from sidebar
  const filteredCaptures = selectedTopicFilter
    ? captures.filter((c) => c.topics.includes(selectedTopicFilter))
    : captures;

  // 3 primary attention cards
  const attentionItems = filteredCaptures.slice(0, 3);
  const resurfacedItem = captures.length > 3 ? captures[3] : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-10">
      {/* Top Welcome & Global Command Prompt */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
              Today
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Good morning
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Here’s what matters from what you’ve captured.
            </p>
          </div>

          {/* Quick command hint */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shadow-2xs hover:shadow-xs transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Search or ask memory...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Active Topic Filter Badge */}
        {selectedTopicFilter && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300">
            <span>Filtering by topic: <strong>{selectedTopicFilter}</strong></span>
            <button
              onClick={() => setSelectedTopicFilter(null)}
              className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </header>

      {captures.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Your memory layer is ready
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Send your first thought, link, or photo to your LINE bot. MINDROP will automatically extract, index, and organize it here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/inbox"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>View Raw Ingestion Inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: WORTH YOUR ATTENTION */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Worth your attention
                </h2>
              </div>
              <span className="text-xs text-zinc-400">
                Synthesized from {captures.length} captures
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {attentionItems.map((item, idx) => (
                <CaptureCard
                  key={item.id}
                  item={item}
                  variant="attention"
                  badgeText={idx === 0 ? "⚡ Top Signal" : undefined}
                />
              ))}
            </div>
          </section>

          {/* SECTION 2: RESURFACED MEMORY */}
          {resurfacedItem && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Worth remembering
                  </h2>
                </div>
                <span className="text-xs text-zinc-400">
                  AI Contextual Memory Recall
                </span>
              </div>

              <CaptureCard item={resurfacedItem} variant="resurfaced" />
            </section>
          )}

          {/* SECTION 3: WEEKLY SIGNAL */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Recent Signal
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                {captures.length} things captured. Key topics extracted:
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(captures.flatMap((c) => c.topics))).map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
