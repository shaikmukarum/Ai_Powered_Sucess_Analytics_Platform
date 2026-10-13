import type { RiskLevel } from "@/types/student";
import { riskTone } from "@/lib/risk";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span data-testid={`risk-badge-${risk.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${riskTone(risk)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{risk} risk</span>;
}