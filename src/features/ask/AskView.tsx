"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useMINDROP } from "@/context/MINDROPContext";
import {
  Sparkles,
  ArrowUp,
  User,
  BookOpen,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Link2,
  Cpu,
  Scan,
  Zap,
  Lightbulb,
} from "lucide-react";
import { ChatMessage, CaptureItem } from "@/types";

export function AskView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { captures, openDetail } = useMINDROP();
  const messageCounter = useRef(100);

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const quickPills = [
    { icon: FileText, label: "Write documentation from memory" },
    { icon: Zap, label: "Summarize Retail AI captures" },
    { icon: Scan, label: "Find architecture diagram screenshot" },
    { icon: Lightbulb, label: "What ideas keep appearing in my saves?" },
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || isSynthesizing) return;

    messageCounter.current += 1;
    const currentId = `msg-user-${messageCounter.current}`;

    const userMsg: ChatMessage = {
      id: currentId,
      role: "user",
      content: queryText,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsSynthesizing(true);

    setTimeout(() => {
      let aiResponseContent = "";
      let groundedSources: CaptureItem[] = [];

      const qLower = queryText.toLowerCase();

      if (qLower.includes("retail") || qLower.includes("สรุปเรื่อง retail")) {
        aiResponseContent =
          "จากข้อมูลที่คุณบันทึกเกี่ยวกับ **Retail AI** ในช่วง 30 วันที่ผ่านมา มีประเด็นสำคัญดังนี้:\n\n1. **Autonomous Procurement:** ร้านค้าชั้นนำเริ่มทดลองใช้ Agent เปรียบเทียบซัพพลายเออร์และออก PO อัตโนมัติ\n2. **Supplier Trust Score:** ปัจจัยสำคัญที่สุดไม่ใช่ราคาที่ถูกที่สุด แต่คือความน่าเชื่อถือและประวัติการส่งมอบตรงเวลา\n3. **Modernization in ASEAN:** กว่า 73% ของ modern trade ในเอเชียตะวันออกเฉียงใต้กำลังย้ายไปสู่ระบบเติมสต็อกอัตโนมัติ";
        groundedSources = captures.filter((c) => c.topics.some((t) => t.toLowerCase().includes("retail"))).slice(0, 3);
      } else if (qLower.includes("ideas") || qLower.includes("appearing") || qLower.includes("signal")) {
        aiResponseContent =
          "Here are the core recurring product & technical ideas across your recent memory drops:\n\n1. **Zero-Organization PKM:** Eliminating manual tagging/folders completely in favor of ambient indexing.\n2. **LINE as Frictionless Ingestion Gateway:** Dropping text/images into LINE with sub-500ms acknowledgment.\n3. **LLM as CPU / Context as RAM:** Treating memory retrieval as dynamic operating system paging.";
        groundedSources = captures.slice(0, 3);
      } else if (qLower.includes("architecture") || qLower.includes("screenshot") || qLower.includes("รูป")) {
        aiResponseContent =
          "I located the architecture diagrams and visual notes in your personal memory stream:\n\n1. **AI Agent Architecture:** Diagram covering user intent, planner reflection loop, episodic memory, and tool execution.\n2. **Whiteboard Sketch:** Outlines context reduction stages before prompt buffer injection.";
        groundedSources = captures.filter((c) => c.type === "image").slice(0, 2);
      } else {
        aiResponseContent = `Found relevant context in your personal memory for "${queryText}".\n\nYour saves highlight practical execution workflows, prioritizing ambient zero-organization indexing and fast retrieval.`;
        groundedSources = captures.slice(0, 3);
      }

      messageCounter.current += 1;
      const aiMsg: ChatMessage = {
        id: `msg-ai-${messageCounter.current}`,
        role: "assistant",
        content: aiResponseContent,
        timestamp: "Just now",
        sources: groundedSources,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsSynthesizing(false);
    }, 600);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "link":
        return <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10 flex flex-col justify-center min-h-[calc(100vh-80px)]">
      {/* Central Input Box & Model Indicator */}
      <div className="space-y-4 max-w-2xl mx-auto w-full">
        {/* Floating Card */}
        <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-sm hover:shadow-md transition-all">
          <textarea
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk(inputQuery);
              }
            }}
            placeholder="Ask anything"
            rows={3}
            className="w-full bg-transparent resize-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 p-1"
          />

          {/* Bottom Bar inside Card */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            {/* Model Badge Display (Configured Model) */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium">Gemini 2.0 Flash</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                FAST
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAsk(inputQuery)}
                disabled={!inputQuery.trim() || isSynthesizing}
                className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all shadow-xs"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-1 text-xs">
          {quickPills.map((pill, i) => {
            const Icon = pill.icon;
            return (
              <button
                key={i}
                onClick={() => handleAsk(pill.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-xs font-medium shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Messages */}
      {messages.length > 0 && (
        <div className="space-y-6 pt-4 max-w-3xl mx-auto w-full">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-5 text-sm space-y-4 ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs text-zinc-800 dark:text-zinc-200"
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                  {msg.content}
                </div>

                {/* Sourced Library Cards */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        Sources from your memory ({msg.sources.length} items)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.sources.map((source) => (
                        <div
                          key={source.id}
                          onClick={() => openDetail(source, "understanding")}
                          className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                              {getTypeIcon(source.type)}
                              {source.source.provider || source.type}
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {source.title}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {source.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading / Synthesizing State */}
          {isSynthesizing && (
            <div className="flex gap-3.5 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs text-xs text-zinc-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synthesizing captured memory graph...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
