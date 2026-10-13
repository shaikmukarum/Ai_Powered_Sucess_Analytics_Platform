import { DatabaseZap } from "lucide-react";

// The healthy "Supabase live" and "Syncing" notices were removed as visual clutter.
// Failures are still shown, so a broken data connection never goes unnoticed.
export function DataSourceBanner({ isError }: { isError?: boolean; isLoading?: boolean }) {
  if (!isError) return null;
  return <div data-testid="data-source-banner" className="flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-rose-200"><DatabaseZap size={13} /><span data-testid="data-source-label">Could not load records · retry shortly</span></div>;
}
