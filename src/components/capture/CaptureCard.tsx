"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CaptureItem } from "@/types";
import { useMINDROP } from "@/context/MINDROPContext";
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Sparkles,
  MoreHorizontal,
  ArrowUpRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface CaptureCardProps {
  item: CaptureItem;
  variant?: "attention" | "resurfaced" | "inbox" | "library";
  badgeText?: string;
}

export function CaptureCard({ item, variant = "attention", badgeText }: CaptureCardProps) {
  const router = useRouter();
  const { openDetail } = useMINDROP();

  const getTypeIcon = () => {
    switch (item.type) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "link":
        return <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case "file":
        return <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  // RESURFACED VARIANT
  if (variant === "resurfaced") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-zinc-900 dark:to-amber-950/10 p-6 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              FROM {item.resurfacedContext?.originalDate || "A WHILE AGO"}
            </span>
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            {item.resurfacedContext?.connectedItemCount || 6} connections
          </span>
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          {item.resurfacedContext?.triggerReason || "You saved this before your recent interest in this topic."}
        </div>

        <h3
          onClick={() => openDetail(item, "understanding")}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug my-2"
        >
          {item.title}
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
          {item.summary}
        </p>

        {/* Why Now Callout */}
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-amber-200/60 dark:border-amber-900/40 mb-4">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Why now?
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {item.whyItMatters}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-100/80 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.topics.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700"
              >
                {t}
              </span>
            ))}
          </div>

          <button
            onClick={() => openDetail(item, "understanding")}
            className="px-3.5 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 bg-amber-100/90 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg transition-colors flex items-center gap-1"
          >
            Revisit
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ATTENTION CARD (TODAY VIEW)
  if (variant === "attention") {
    return (
      <div className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {getTypeIcon()}
              </span>
              <span className="text-xs font-medium text-zinc-500">
                {item.source.provider || item.source.channel}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs text-zinc-400">{item.capturedAt}</span>
            </div>

            {badgeText && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                {badgeText}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => openDetail(item, "understanding")}
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug mb-2"
          >
            {item.title}
          </h3>

          {/* Thumbnail preview if any */}
          {item.thumbnailUrl && (
            <div
              onClick={() => openDetail(item, "original")}
              className="relative w-full h-32 rounded-xl overflow-hidden mb-3 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 cursor-pointer flex items-center justify-center"
            >
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                width={360}
                height={130}
                className="object-cover w-full h-full opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          )}

          {/* Summary */}
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
            {item.summary}
          </p>

          {/* Why this matters */}
          {item.whyItMatters && (
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 mb-3.5">
              <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Why this matters
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {item.whyItMatters}
              </p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.topics.map((t) => (
              <span
                key={t}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                onClick={() => openDetail(item, "understanding")}
              >
                #{t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openDetail(item, "original")}
              className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Open
            </button>
            <button
              onClick={() => {
                router.push(`/ask?q=${encodeURIComponent(item.title)}`);
              }}
              className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Ask AI
            </button>
            <button
              onClick={() => openDetail(item, "understanding")}
              aria-label="More options"
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INBOX & LIBRARY LIST / GRID ITEM
  return (
    <div
      onClick={() => openDetail(item, "understanding")}
      className="group p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              {getTypeIcon()}
            </span>
            <span className="text-xs font-medium text-zinc-500 capitalize">
              {item.type} · {item.source.provider || item.source.channel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.status === "processing" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                Understanding...
              </span>
            ) : item.status === "needs_review" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                Needs review
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.capturedAt}
              </span>
            )}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-1.5">
          {item.title}
        </h4>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          {item.summary}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.topics.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[11px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 flex items-center gap-0.5">
          Details
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
