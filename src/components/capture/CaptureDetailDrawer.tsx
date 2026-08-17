"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMINDROP } from "@/context/MINDROPContext";
import {
  X,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Clock,
  Tag,
  Share2,
  ArrowRight,
  BookmarkCheck,
  Cpu,
} from "lucide-react";
import Image from "next/image";

export function CaptureDetailDrawer() {
  const router = useRouter();
  const {
    selectedItem,
    isDetailOpen,
    closeDetail,
    activeDetailTab,
    setActiveDetailTab,
    getRelatedCaptures,
    openDetail,
  } = useMINDROP();

  if (!isDetailOpen || !selectedItem) return null;

  const relatedCaptures = getRelatedCaptures(selectedItem);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "link":
        return <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "file":
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end"
      onClick={closeDetail}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {getSourceIcon(selectedItem.type)}
                <span className="capitalize">{selectedItem.type}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                LINE Bot · {selectedItem.source.provider || "Capture"}
              </span>

              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedItem.capturedAt}
              </span>
            </div>
            <h2 id="drawer-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
              {selectedItem.title}
            </h2>
          </div>

          <button
            onClick={closeDetail}
            aria-label="Close drawer"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-zinc-100 dark:border-zinc-800 flex gap-6 bg-white dark:bg-zinc-900">
          <button
            onClick={() => setActiveDetailTab("understanding")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeDetailTab === "understanding"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Understanding
          </button>
          <button
            onClick={() => setActiveDetailTab("original")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeDetailTab === "original"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Original
          </button>
          <button
            onClick={() => setActiveDetailTab("connections")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeDetailTab === "connections"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Connections ({relatedCaptures.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AI Understanding */}
          {activeDetailTab === "understanding" && (
            <div className="space-y-6 animate-fade-in">
              {/* Why It Matters Callout */}
              {selectedItem.whyItMatters && (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Why MINDROP flagged this
                  </div>
                  <p className="text-xs text-blue-900/90 dark:text-blue-200 leading-relaxed">
                    {selectedItem.whyItMatters}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                  Executive AI Summary
                </h3>
                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  {selectedItem.summary}
                </div>
              </div>

              {/* Key Ideas */}
              {selectedItem.keyIdeas && selectedItem.keyIdeas.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                    Extracted Key Ideas
                  </h3>
                  <ul className="space-y-2">
                    {selectedItem.keyIdeas.map((idea, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Topics & Entities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.topics.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedItem.entities && selectedItem.entities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" />
                      Entities & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.entities.map((ent) => (
                        <span
                          key={ent}
                          className="px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Original */}
          {activeDetailTab === "original" && (
            <div className="space-y-5 animate-fade-in">
              {/* Visual Thumbnail / Screenshot if image */}
              {selectedItem.thumbnailUrl && (
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 p-2">
                  <div className="relative w-full h-56 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-900">
                    <Image
                      src={selectedItem.thumbnailUrl}
                      alt={selectedItem.title}
                      width={400}
                      height={220}
                      className="object-contain max-h-full"
                    />
                  </div>
                  <div className="p-2 text-center text-xs text-zinc-500">
                    Original LINE Image / Screenshot payload
                  </div>
                </div>
              )}

              {/* URL Preview if link */}
              {selectedItem.source.url && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Target Link
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
                      {selectedItem.source.url}
                    </div>
                  </div>
                  <a
                    href={selectedItem.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Raw Captured Text */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                  Raw Ingested Text
                </h3>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.rawText || selectedItem.summary}
                </div>
              </div>

              {/* Provenance Metadata */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Channel:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">LINE Bot Webhook</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">{selectedItem.source.provider || "Direct"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capture ID:</span>
                  <span className="font-mono text-zinc-500">{selectedItem.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize font-medium text-emerald-600 dark:text-emerald-400">
                    {selectedItem.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Connections */}
          {activeDetailTab === "connections" && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs text-zinc-500">
                MINDROP dynamically connects this memory with <span className="font-medium text-zinc-900 dark:text-zinc-100">{relatedCaptures.length} other items</span> based on semantic similarity.
              </div>

              <div className="space-y-3">
                {relatedCaptures.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => openDetail(rel, "understanding")}
                    className="w-full text-left p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                        {getSourceIcon(rel.type)}
                        {rel.source.provider || rel.type} · {rel.capturedAt}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">
                      {rel.title}
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2">
                      {rel.summary}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rel.topics.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeDetail();
                router.push(`/ask?q=${encodeURIComponent(selectedItem.title)}`);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI about this
            </button>
            <button
              onClick={() => alert("Memory saved to starred insight")}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save insight
            </button>
          </div>

          <button
            onClick={() => alert("Shareable memory link copied!")}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
