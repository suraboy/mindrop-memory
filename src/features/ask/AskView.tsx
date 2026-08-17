"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useMINDROP } from "@/context/MINDROPContext";
import {
  Sparkles,
  ArrowRight,
  User,
  BookOpen,
  ArrowUpRight,
  CornerDownLeft,
  FileText,
  Image as ImageIcon,
  Link2,
} from "lucide-react";
import { ChatMessage, CaptureItem } from "@/types";

export function AskView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { captures, openDetail } = useMINDROP();
  const messageCounter = useRef(100);

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const base: ChatMessage[] = [
      {
        id: "msg-1",
        role: "user",
        content: "What have I captured about agent memory?",
        timestamp: "10 mins ago",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "You’ve captured 14 items related to agent memory over the last 6 weeks.\n\nThey cluster into three primary themes:\n\n1. **Episodic memory:** Hierarchical consolidation and decaying curves that emulate biological memory systems.\n2. **Semantic retrieval:** Hybrid sparse/dense retrieval models for high-accuracy concept recall.\n3. **Context compression:** Separating long-term knowledge from short-term execution buffers.\n\nThe strongest recurring idea is separating long-term knowledge from short-term execution context to avoid context bloat.",
        timestamp: "10 mins ago",
        sources: [
          captures.find((c) => c.id === "cap-05")!,
          captures.find((c) => c.id === "cap-02")!,
          captures.find((c) => c.id === "cap-08")!,
          captures.find((c) => c.id === "cap-03")!,
        ].filter(Boolean),
      },
    ];

    if (initialQuery && initialQuery !== "What have I captured about agent memory?") {
      base.push({
        id: "msg-init",
        role: "user",
        content: initialQuery,
        timestamp: "Just now",
      });
      base.push({
        id: "msg-init-ai",
        role: "assistant",
        content: `Analyzing personal memory for: "${initialQuery}"...\n\nFound 3 interconnected clusters in your knowledge memory with direct provenance to LINE captures.`,
        timestamp: "Just now",
        sources: captures.slice(0, 3),
      });
    }
    return base;
  });

  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const suggestedPrompts = [
    "What have I saved about AI agents recently?",
    "สรุปเรื่อง Retail AI ที่เก็บไว้เดือนนี้",
    "What ideas keep appearing in my saves?",
    "Find the architecture screenshot about agent memory.",
  ];

  const handleAsk = (queryText: string) => {
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

    // Mock realistic AI synthesis grounded in captures
    setTimeout(() => {
      let aiResponseContent = "";
      let groundedSources: CaptureItem[] = [];

      const qLower = queryText.toLowerCase();

      if (qLower.includes("retail") || qLower.includes("สรุปเรื่อง retail")) {
        aiResponseContent =
          "จากข้อมูลที่คุณบันทึกเกี่ยวกับ **Retail AI** ในช่วง 30 วันที่ผ่านมา มีประเด็นสำคัญดังนี้:\n\n1. **Autonomous Procurement:** ร้านค้าชั้นนำเริ่มทดลองใช้ Agent เปรียบเทียบซัพพลายเออร์และออก PO อัตโนมัติ (พบในโพสต์ Facebook และ Report)\n2. **Supplier Trust Score:** ปัจจัยสำคัญที่สุดไม่ใช่ราคาที่ถูกที่สุด แต่คือความน่าเชื่อถือและประวัติการส่งมอบตรงเวลา\n3. **Modernization in ASEAN:** กว่า 73% ของ modern trade ในเอเชียตะวันออกเฉียงใต้กำลังย้ายไปสู่ระบบเติมสต็อกอัตโนมัติ";
        groundedSources = [
          captures.find((c) => c.id === "cap-01")!,
          captures.find((c) => c.id === "cap-06")!,
          captures.find((c) => c.id === "cap-07")!,
        ].filter(Boolean);
      } else if (qLower.includes("ideas") || qLower.includes("appearing") || qLower.includes("signal")) {
        aiResponseContent =
          "Here are the core recurring product & technical ideas across your recent memory drops:\n\n1. **Zero-Organization PKM:** Eliminating manual tagging/folders completely in favor of ambient indexing.\n2. **LINE as Frictionless Ingestion Gateway:** Dropping text/images into LINE with sub-500ms acknowledgment.\n3. **LLM as CPU / Context as RAM:** Treating memory retrieval as dynamic operating system paging.";
        groundedSources = [
          captures.find((c) => c.id === "cap-04")!,
          captures.find((c) => c.id === "cap-10")!,
          captures.find((c) => c.id === "cap-09")!,
          captures.find((c) => c.id === "cap-03")!,
        ].filter(Boolean);
      } else if (qLower.includes("architecture") || qLower.includes("screenshot")) {
        aiResponseContent =
          "I located 2 architecture diagrams and screenshots in your memory:\n\n1. **AI Agent Architecture (Facebook Screenshot):** Diagram covering user intent, planner reflection loop, episodic memory, and tool execution.\n2. **Whiteboard Sketch (Token Compression):** Outlines context reduction stages before prompt buffer injection.";
        groundedSources = [
          captures.find((c) => c.id === "cap-02")!,
          captures.find((c) => c.id === "cap-08")!,
        ].filter(Boolean);
      } else {
        aiResponseContent = `Found relevant context in your personal memory for "${queryText}".\n\nYour saves highlight practical execution workflows over theoretical models, prioritizing ambient retrieval and contextual resurfacing.`;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <header className="space-y-1.5 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Grounded Memory Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ask MINDROP
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ask anything about what you&apos;ve captured. Grounded in your own memory, not generic web training data.
        </p>
      </header>

      {/* Suggested Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(prompt)}
            className="p-3 text-left rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 shadow-2xs transition-all flex items-start justify-between gap-2 group"
          >
            <span className="leading-snug">{prompt}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
          </button>
        ))}
      </div>

      {/* Conversation Stream */}
      <div className="space-y-6 pt-4">
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
                    <span className="text-[10px] text-zinc-400">
                      Click to open deep dive
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
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Synthesizing captured items &amp; memory graph...</span>
            </div>
          </div>
        )}
      </div>

      {/* Central Input Bar */}
      <div className="sticky bottom-4 z-30 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(inputQuery);
          }}
          className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 transition-all"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask your memory... (e.g. 'What retail insights did I save?')"
            className="w-full pl-5 pr-24 py-4 text-sm bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isSynthesizing}
            className="absolute right-2 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
