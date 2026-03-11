import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function calculateEarnings(seconds: number, dailyRate: number): number {
  const hours = seconds / 3600;
  const dailyHours = 8;
  return (hours / dailyHours) * dailyRate;
}

export const PROJECT_COLORS = [
  "#3333FF",
  "#FF6EB4",
  "#7B3FE4",
  "#F5A623",
  "#00D68F",
  "#FF4444",
  "#00B5D8",
  "#38A169",
  "#DD6B20",
  "#805AD5",
  "#D53F8C",
  "#2B6CB0",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const PLAN_LIMITS = {
  free: {
    projects: 10,
    clients: 5,
    members: 1,
    pdf: false,
  },
  premium: {
    projects: 20,
    clients: 15,
    members: 2,
    pdf: true,
  },
  business: {
    projects: Infinity,
    clients: Infinity,
    members: Infinity,
    pdf: true,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
