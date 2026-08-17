"use client";

import React from "react";
import { Sparkles, ArrowRight, TrendingUp, X } from "lucide-react";
import { useMINDROP } from "@/context/MINDROPContext";
import { CaptureCard } from "@/components/capture/CaptureCard";
import { MOCK_WEEKLY_SIGNAL } from "@/lib/mock-data/captures";
import Link from "next/link";

export function TodayView() {
  const { captures, setCommandOpen, selectedTopicFilter, setSelectedTopicFilter } = useMINDROP();

  // Filter if topic selected from sidebar
  const filteredCaptures = selectedTopicFilter
    ? captures.filter((c) => c.topics.includes(selectedTopicFilter))
    : captures;

  // 3 primary attention cards
  const attentionItems = filteredCaptures
    .filter((c) => c.id !== "cap-05")
    .slice(0, 3);

  // Resurfaced item (cap-05: 3 months ago)
  const resurfacedItem = captures.find((c) => c.id === "cap-05");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
      {/* Top Welcome & Global Command Prompt */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
              Monday, Aug 17
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
            Synthesized from 10 recent drops
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
              {MOCK_WEEKLY_SIGNAL.title}
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {MOCK_WEEKLY_SIGNAL.period}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {MOCK_WEEKLY_SIGNAL.description} 3 ideas are showing up repeatedly across your saves:
          </div>

          <div className="space-y-3.5">
            {MOCK_WEEKLY_SIGNAL.keyTrends.map((trend, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
              >
                <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5">
                  0{i + 1}
                </span>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {trend}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Transformed raw noise into actionable signal
            </span>

            <Link
              href="/ask?q=Summarize%20this%20week's%20recurring%20signals"
              className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              See weekly synthesis
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
