"use client";
import { AIChat } from "@/components/ai/AIChat";
import { Sparkles } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Sparkles size={16} className="text-accent" />
        <h1 className="text-[15px] font-semibold text-ink">AI Assistant</h1>
        <span className="text-[12px] text-ink-faint">Your visual second brain, powered by AI</span>
      </div>
      <div className="min-h-0 flex-1">
        <AIChat />
      </div>
    </div>
  );
}
