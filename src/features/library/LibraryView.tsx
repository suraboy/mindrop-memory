"use client";

import React, { useState, useMemo } from "react";
import { useMINDROP } from "@/context/MINDROPContext";
import { CaptureCard } from "@/components/capture/CaptureCard";
import {
  Search,
  Bookmark,
  Layers,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Lightbulb,
  BookOpen,
  Image as ImageIcon,
  Link2,
} from "lucide-react";

type LibraryCategoryTab = "all" | "knowledge" | "ideas" | "images" | "links";

export function LibraryView() {
  const { captures, selectedTopicFilter, setSelectedTopicFilter } = useMINDROP();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LibraryCategoryTab>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const exampleQueries = [
    "agent memory",
    "ของที่เกี่ยวกับ retail AI",
    "รูป architecture ที่เคยส่ง",
  ];

  const categoryTabs: { id: LibraryCategoryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: "All", icon: Layers },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "ideas", label: "Ideas", icon: Lightbulb },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "links", label: "Links", icon: Link2 },
  ];

  // Derive dynamic topic clusters from live captures
  const dynamicTopics = useMemo(() => {
    const counts = new Map<string, number>();
    captures.forEach((c) => {
      c.topics.forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, count }))
      .sort((a, b) => b.count - a.count);
  }, [captures]);

  const filteredCaptures = useMemo(() => {
    return captures.filter((item) => {
      // 1. Topic filter
      if (selectedTopicFilter && !item.topics.includes(selectedTopicFilter)) {
        return false;
      }

      // 2. Category tab filter
      if (activeTab === "knowledge" && item.category !== "knowledge") return false;
      if (activeTab === "ideas" && item.category !== "idea") return false;
      if (activeTab === "images" && item.type !== "image") return false;
      if (activeTab === "links" && item.type !== "link") return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inTopics = item.topics.some((t) => t.toLowerCase().includes(q));
        const inRawText = item.rawText ? item.rawText.toLowerCase().includes(q) : false;
        const inEntities = item.entities ? item.entities.some((e) => e.toLowerCase().includes(q)) : false;

        return inTitle || inSummary || inTopics || inRawText || inEntities;
      }

      return true;
    });
  }, [captures, selectedTopicFilter, activeTab, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          <Bookmark className="w-4 h-4 text-blue-500" />
          <span>Semantic Knowledge Space</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Library
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Everything MINDROP remembers. Connected by meaning, not folders.
        </p>
      </header>

      {/* Semantic Search Input */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything you've captured... (supports English & ภาษาไทย)"
            className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-sm placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap pt-1">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Try:
          </span>
          {exampleQueries.map((ex) => (
            <button
              key={ex}
              onClick={() => setSearchQuery(ex)}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Topic Chips */}
      {dynamicTopics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium uppercase tracking-wider">
            <span>AI Generated Topic Clusters</span>
            {selectedTopicFilter && (
              <button
                onClick={() => setSelectedTopicFilter(null)}
                className="text-blue-600 dark:text-blue-400 lowercase hover:underline"
              >
                clear topic filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {dynamicTopics.map((topic) => {
              const isSelected = selectedTopicFilter === topic.name;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicFilter(isSelected ? null : topic.name)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span>{topic.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? "bg-zinc-700 text-zinc-200 dark:bg-zinc-300 dark:text-zinc-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {topic.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-zinc-400 font-mono">
            {filteredCaptures.length} items
          </span>
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${
                viewMode === "grid"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${
                viewMode === "list"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge Cards Grid / List */}
      {filteredCaptures.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {filteredCaptures.map((item) => (
            <CaptureCard key={item.id} item={item} variant="library" />
          ))}
        </div>
      ) : (
        /* Empty Search State */
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Nothing in your memory matches this yet.
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Drop notes or photos to LINE bot to populate your knowledge library.
          </p>
        </div>
      )}
    </div>
  );
}
