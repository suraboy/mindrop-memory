"use client";

import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/command/CommandPalette";
import { CaptureDetailDrawer } from "@/components/capture/CaptureDetailDrawer";
import { MINDROPProvider } from "@/context/MINDROPContext";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MINDROPProvider>
      <div className="flex min-h-screen bg-[#FBFBFB] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <MobileNav />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>

        {/* Global Overlays */}
        <CommandPalette />
        <CaptureDetailDrawer />
      </div>
    </MINDROPProvider>
  );
}
