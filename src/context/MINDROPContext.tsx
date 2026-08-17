"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CaptureItem } from "@/types";
import { MOCK_CAPTURES } from "@/lib/mock-data/captures";

interface MINDROPContextType {
  captures: CaptureItem[];
  selectedItem: CaptureItem | null;
  isDetailOpen: boolean;
  activeDetailTab: "original" | "understanding" | "connections";
  isCommandOpen: boolean;
  selectedTopicFilter: string | null;
  openDetail: (item: CaptureItem, tab?: "original" | "understanding" | "connections") => void;
  closeDetail: () => void;
  setActiveDetailTab: (tab: "original" | "understanding" | "connections") => void;
  setCommandOpen: (open: boolean) => void;
  setSelectedTopicFilter: (topic: string | null) => void;
  getCaptureById: (id: string) => CaptureItem | undefined;
  getRelatedCaptures: (item: CaptureItem) => CaptureItem[];
}

const MINDROPContext = createContext<MINDROPContextType | undefined>(undefined);

export function MINDROPProvider({ children }: { children: ReactNode }) {
  const [captures] = useState<CaptureItem[]>(MOCK_CAPTURES);
  const [selectedItem, setSelectedItem] = useState<CaptureItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"original" | "understanding" | "connections">("understanding");
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string | null>(null);

  // Global shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (isCommandOpen) setCommandOpen(false);
        if (isDetailOpen) setIsDetailOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandOpen, isDetailOpen]);

  const openDetail = (
    item: CaptureItem,
    tab: "original" | "understanding" | "connections" = "understanding"
  ) => {
    setSelectedItem(item);
    setActiveDetailTab(tab);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
  };

  const getCaptureById = (id: string) => {
    return captures.find((c) => c.id === id);
  };

  const getRelatedCaptures = (item: CaptureItem): CaptureItem[] => {
    if (item.relatedItemIds && item.relatedItemIds.length > 0) {
      return item.relatedItemIds
        .map((id) => captures.find((c) => c.id === id))
        .filter((c): c is CaptureItem => Boolean(c));
    }
    // Fallback: match by common topic
    return captures
      .filter((c) => c.id !== item.id && c.topics.some((t) => item.topics.includes(t)))
      .slice(0, 4);
  };

  return (
    <MINDROPContext.Provider
      value={{
        captures,
        selectedItem,
        isDetailOpen,
        activeDetailTab,
        isCommandOpen,
        selectedTopicFilter,
        openDetail,
        closeDetail,
        setActiveDetailTab,
        setCommandOpen,
        setSelectedTopicFilter,
        getCaptureById,
        getRelatedCaptures,
      }}
    >
      {children}
    </MINDROPContext.Provider>
  );
}

export function useMINDROP() {
  const context = useContext(MINDROPContext);
  if (!context) {
    throw new Error("useMINDROP must be used within a MINDROPProvider");
  }
  return context;
}
