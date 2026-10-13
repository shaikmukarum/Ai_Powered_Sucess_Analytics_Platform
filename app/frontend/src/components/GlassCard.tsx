import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-[#c4b5fd]/[0.12] bg-white/[0.035] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.28)] transition-all duration-200 hover:border-[#c4b5fd]/25", className)} {...props}>{children}</div>;
}