import { Suspense } from "react";
import { AskView } from "@/features/ask/AskView";

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-zinc-400">
          Loading memory index...
        </div>
      }
    >
      <AskView />
    </Suspense>
  );
}
