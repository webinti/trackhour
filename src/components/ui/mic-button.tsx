"use client";

import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  isTranscribing?: boolean;
  onClick: () => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function MicButton({ isRecording, isSupported, isTranscribing = false, onClick, label, size = "sm", className }: MicButtonProps) {
  if (!isSupported) return null;

  const iconSize = size === "sm" ? 13 : 16;
  const title = isTranscribing
    ? `Transcription en cours — ${label}`
    : isRecording
    ? `Arrêter — ${label}`
    : `Dicter — ${label}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isTranscribing}
      title={title}
      aria-label={title}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all shrink-0",
        size === "sm" ? "w-7 h-7" : "w-9 h-9",
        isRecording
          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
          : isTranscribing
          ? "bg-blue-50 text-[var(--brand-blue)] cursor-wait"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600",
        className
      )}
    >
      {isRecording && (
        <motion.span
          className="absolute inset-0 rounded-full bg-red-400"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {isTranscribing ? (
        <Loader2 size={iconSize} className="relative z-10 animate-spin" />
      ) : (
        <Mic size={iconSize} className="relative z-10" />
      )}
    </button>
  );
}
