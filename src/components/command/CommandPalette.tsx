"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMINDROP } from "@/context/MINDROPContext";
import {
  Search,
  Sparkles,
  Layers,
  Inbox,
  Bookmark,
  Settings,
  ArrowRight,
  X,
  FileText,
  Image as ImageIcon,
  Link2,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandOpen,
    setCommandOpen,
    captures,
    openDetail,
  } = useMINDROP();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandOpen]);

  if (!isCommandOpen) return null;

  const handleClose = () => {
    setQuery("");
    setCommandOpen(false);
  };

  const filteredCaptures = query.trim()
    ? captures.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.summary.toLowerCase().includes(query.toLowerCase()) ||
          c.topics.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          (c.rawText && c.rawText.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleSelectRoute = (path: string) => {
    handleClose();
    router.push(path);
  };

  const handleSelectCapture = (item: (typeof captures)[0]) => {
    handleClose();
    openDetail(item, "understanding");
  };

  const handleAsk = () => {
    handleClose();
    router.push(`/ask?q=${encodeURIComponent(query)}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />;
      case "link":
        return <Link2 className="w-3.5 h-3.5 text-zinc-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                if (filteredCaptures.length > 0) {
                  handleSelectCapture(filteredCaptures[0]);
                } else {
                  handleAsk();
                }
              }
            }}
            placeholder="Search memory, ask a question, or jump to..."
            className="w-full py-3.5 text-sm bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {query.trim() && (
            <div className="pb-2">
              <button
                onClick={handleAsk}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    Ask MINDROP &ldquo;<span className="font-medium text-blue-600 dark:text-blue-400">{query}</span>&rdquo;
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Matched Captures */}
          {filteredCaptures.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-medium tracking-wide uppercase text-zinc-400">
                Memory Matches
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredCaptures.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCapture(item)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="truncate">
                        <div className="text-zinc-900 dark:text-zinc-100 text-xs font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-zinc-400 text-[11px] truncate">
                          {item.topics.join(" · ")}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      {item.source.provider || item.source.channel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigations */}
          {!query.trim() && (
            <div className="py-1">
              <div className="px-3 py-1 text-[11px] font-medium tracking-wide uppercase text-zinc-400">
                Navigation
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => handleSelectRoute("/")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    <span>Today</span>
                  </div>
                  <span className="text-xs text-zinc-400">Jump</span>
                </button>
                <button
                  onClick={() => handleSelectRoute("/inbox")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-zinc-400" />
                    <span>Inbox</span>
                  </div>
                  <span className="text-xs text-zinc-400">Jump</span>
                </button>
                <button
                  onClick={() => handleSelectRoute("/library")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="w-4 h-4 text-zinc-400" />
                    <span>Library</span>
                  </div>
                  <span className="text-xs text-zinc-400">Jump</span>
                </button>
                <button
                  onClick={() => handleSelectRoute("/ask")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-zinc-400" />
                    <span>Ask MINDROP</span>
                  </div>
                  <span className="text-xs text-zinc-400">Jump</span>
                </button>
                <button
                  onClick={() => handleSelectRoute("/settings")}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Settings</span>
                  </div>
                  <span className="text-xs text-zinc-400">Jump</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>MINDROP Intelligence</span>
        </div>
      </div>
    </div>
  );
}
