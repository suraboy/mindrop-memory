"use client";

import React, { useState } from "react";
import {
  Settings,
  MessageCircle,
  Cpu,
  Database,
  Download,
  CheckCircle2,
  Zap,
  Sliders,
} from "lucide-react";

export function SettingsView() {
  const [resurfacingLevel, setResurfacingLevel] = useState<"calm" | "balanced" | "proactive">("calm");
  const [autoSummaryThai, setAutoSummaryThai] = useState(true);
  const [powerProfile, setPowerProfile] = useState<"economy" | "balanced" | "pro">("balanced");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          <Settings className="w-4 h-4 text-zinc-500" />
          <span>System &amp; Integration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage LINE ingestion, AI model harness governance, and memory storage.
        </p>
      </header>

      {/* Section 1: AI Model Harness Governor */}
      <section className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                AI Harness Model Power Controller
              </h2>
              <p className="text-xs text-zinc-500">
                Dedicated governor routing specialized Gemini power per task type.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
            <Sliders className="w-3.5 h-3.5" />
            Active Governor
          </span>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">OCR &amp; Vision</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Temp 0.1</span>
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">gemini-3.7-flash</div>
            <div className="text-[11px] text-zinc-500">High-precision verbatim Thai/English OCR extraction.</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Chat &amp; Q&amp;A</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Temp 0.4</span>
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">gemini-3.7-flash</div>
            <div className="text-[11px] text-zinc-500">Conversational retrieval grounded in memory context.</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Deep Analysis</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">Temp 0.2</span>
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">gemini-3.7-flash</div>
            <div className="text-[11px] text-zinc-500">Topic cluster synthesis and entity relationship linking.</div>
          </div>
        </div>

        {/* Model Power Profile Selection */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Harness Power Profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "economy", label: "Economy", desc: "Fast & lightweight token limits" },
              { id: "balanced", label: "Balanced (Recommended)", desc: "Optimal speed, intelligence & cost" },
              { id: "pro", label: "Pro Max", desc: "Deep multi-stage reasoning" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPowerProfile(opt.id as "economy" | "balanced" | "pro")}
                className={`p-3 rounded-xl text-left border transition-all ${
                  powerProfile === opt.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{opt.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: LINE Integration */}
      <section className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                LINE Official Account Gateway
              </h2>
              <p className="text-xs text-zinc-500">
                Connected as <span className="font-mono font-medium text-emerald-600">@mindrop_bot</span>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
          <div className="font-medium text-zinc-800 dark:text-zinc-200">How to capture:</div>
          <div>1. Forward any chat text, links, photos, or voice notes to @mindrop_bot in LINE.</div>
          <div>2. MINDROP automatically extracts text, classifies topics, and syncs into your knowledge memory.</div>
        </div>
      </section>

      {/* Section 3: AI Memory Preferences */}
      <section className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Intelligence Tuning
            </h2>
            <p className="text-xs text-zinc-500">
              Configure how proactively MINDROP connects and resurfaces past knowledge.
            </p>
          </div>
        </div>

        {/* Resurfacing Frequency */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Memory Resurfacing Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "calm", label: "Calm (Recommended)", desc: "Only high-confidence relevant memories" },
              { id: "balanced", label: "Balanced", desc: "Daily synthesis + weekly signals" },
              { id: "proactive", label: "Proactive", desc: "Frequent associative links" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setResurfacingLevel(opt.id as "calm" | "balanced" | "proactive")}
                className={`p-3 rounded-xl text-left border transition-all ${
                  resurfacingLevel === opt.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{opt.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language preference */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Bilingual Thai/English Synthesis
            </div>
            <div className="text-[11px] text-zinc-500">
              Preserve original Thai language nuance while generating structured insights.
            </div>
          </div>
          <button
            onClick={() => setAutoSummaryThai(!autoSummaryThai)}
            className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              autoSummaryThai ? "bg-zinc-900 dark:bg-zinc-100 justify-end" : "bg-zinc-200 dark:bg-zinc-700 justify-start"
            }`}
          >
            <div className={`w-5 h-5 rounded-full ${autoSummaryThai ? "bg-white dark:bg-zinc-900" : "bg-white"}`} />
          </button>
        </div>
      </section>

      {/* Section 4: Memory Storage & Export */}
      <section className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Knowledge Memory Footprint
            </h2>
            <p className="text-xs text-zinc-500">
              PostgreSQL storage &amp; vector embedding index.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => alert("Memory export generated as mindrop-backup.json")}
            className="px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Raw Memory (JSON)
          </button>
        </div>
      </section>
    </div>
  );
}
