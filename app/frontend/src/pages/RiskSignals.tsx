import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, BrainCircuit, Filter, GraduationCap, ShieldAlert, Target, TrendingDown, UsersRound } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/lib/recharts";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { RiskBadge } from "@/components/RiskBadge";
import { departments, type RiskLevel } from "@/types/student";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { riskColor } from "@/lib/risk";

type RiskMode = "academic" | "placement";

interface RiskHistoryPoint {
  semester: number;
  score: number;
  attendance: number;
  cgpa: number;
}

interface RiskSignal {
  id: string;
  name: string;
  department: string;
  semester: number;
  academicRisk: RiskLevel;
  placementRisk: RiskLevel;
  successScore: number;
  attendance: number;
  cgpa: number;
  placement: number;
  skills: number;
  history: RiskHistoryPoint[];
}

interface RiskSignalsResponse {
  source: string;
  signals: RiskSignal[];
  assessedAt: string;
}

const tooltipStyle = { background: "#171728", border: "1px solid rgba(196,181,253,0.18)", borderRadius: "12px", color: "#F5F3FF", fontSize: "11px" };
const riskOrder: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };

function riskFor(signal: RiskSignal, mode: RiskMode): RiskLevel {
  return mode === "academic" ? signal.academicRisk : signal.placementRisk;
}

function readinessFor(signal: RiskSignal, mode: RiskMode): number {
  return mode === "academic" ? signal.successScore : Math.round(signal.placement * 0.58 + signal.skills * 0.42);
}

export default function RiskSignals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<RiskMode>("academic");
  const [department, setDepartment] = useState("All departments");
  const [risk, setRisk] = useState("All risk levels");
  const query = useQuery({ queryKey: ["risk-signals", user?.role, user?.department], queryFn: () => apiGet<RiskSignalsResponse>("/risk-signals"), enabled: Boolean(user), retry: 1 });
  const response: RiskSignalsResponse = query.data ?? { source: "supabase", assessedAt: "", signals: [] };
    const filtered = useMemo(() => response.signals.filter((signal) => (department === "All departments" || signal.department === department) && (risk === "All risk levels" || riskFor(signal, mode) === risk)), [response.signals, department, risk, mode]);
  const distribution = useMemo(() => (["Low", "Medium", "High"] as RiskLevel[]).map((level) => ({ name: level, value: filtered.filter((signal) => riskFor(signal, mode) === level).length, color: riskColor(level) })), [filtered, mode]);
  const highCount = filtered.filter((signal) => riskFor(signal, mode) === "High").length;
  const mediumCount = filtered.filter((signal) => riskFor(signal, mode) === "Medium").length;
  const lowCount = filtered.filter((signal) => riskFor(signal, mode) === "Low").length;
  const ranked = useMemo(() => [...filtered].sort((a, b) => riskOrder[riskFor(a, mode)] - riskOrder[riskFor(b, mode)] || readinessFor(a, mode) - readinessFor(b, mode)).slice(0, 8), [filtered, mode]);
  const trend = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const exposures = filtered.map((signal) => {
      if (mode === "academic") return signal.history[index]?.score ?? signal.successScore;
      return Math.max(10, readinessFor(signal, mode) - (7 - index) * 2 + ((signal.semester + index) % 4));
    });
    return { semester: `S${index + 1}`, exposure: Math.round(exposures.filter((score) => score <= 70).length / Math.max(1, exposures.length) * 100), severe: Math.round(exposures.filter((score) => score < 45).length / Math.max(1, exposures.length) * 100) };
  }), [filtered, mode]);
  const visibleDepartments = user?.role === "faculty" ? departments.filter((item) => item === user.department) : departments;
  return <div data-testid="risk-signals-page" className="page-enter p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1680px] space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p data-testid="risk-page-eyebrow" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#fb7185]">mission control / risk intelligence</p><h1 data-testid="risk-page-heading" className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Risk signals</h1><p data-testid="risk-page-subheading" className="mt-2 max-w-2xl text-sm text-[#a1a1b5]">Separate academic and placement exposure, isolate the cohorts under pressure, and move directly from signal to student action.</p></div><DataSourceBanner isError={query.isError} isLoading={query.isLoading} /></div>
    <div data-testid="risk-mode-switcher" className="inline-flex rounded-xl border border-[#c4b5fd]/12 bg-white/[0.03] p-1"><button data-testid="academic-risk-tab" onClick={() => setMode("academic")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition ${mode === "academic" ? "bg-[#c4b5fd]/15 text-[#c4b5fd]" : "text-[#6e6e85] hover:text-[#a1a1b5]"}`}><GraduationCap size={14} />Academic risk</button><button data-testid="placement-risk-tab" onClick={() => setMode("placement")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs transition ${mode === "placement" ? "bg-[#67e8f9]/10 text-[#67e8f9]" : "text-[#6e6e85] hover:text-[#a1a1b5]"}`}><Target size={14} />Placement risk</button></div>
    <section data-testid="risk-kpi-grid" className="grid grid-cols-2 gap-3 lg:grid-cols-4"><RiskKpi label="Profiles in scope" value={filtered.length} detail={user?.role === "faculty" ? `${user.department} faculty scope` : "Institution-wide view"} icon={UsersRound} tone="purple" /><RiskKpi label="High risk" value={highCount} detail={`${Math.round(highCount / Math.max(1, filtered.length) * 100)}% require immediate action`} icon={ShieldAlert} tone="rose" /><RiskKpi label="Medium risk" value={mediumCount} detail="Monitor and reinforce" icon={Activity} tone="amber" /><RiskKpi label="Low risk" value={lowCount} detail="Healthy trajectory" icon={BrainCircuit} tone="green" /></section>
    <GlassCard className="p-4"><div data-testid="risk-filter-bar" className="flex flex-col justify-between gap-3 sm:flex-row"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e6e85]"><Filter size={13} />Focus the signal</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:w-[410px]"><select data-testid="risk-department-filter" value={department} onChange={(event) => setDepartment(event.target.value)} disabled={user?.role === "faculty"} className="h-10 rounded-xl border border-[#c4b5fd]/12 bg-[#171728] px-3 text-xs text-[#a1a1b5] outline-none disabled:opacity-60"><option>All departments</option>{visibleDepartments.map((item) => <option key={item}>{item}</option>)}</select><select data-testid="risk-level-filter" value={risk} onChange={(event) => setRisk(event.target.value)} className="h-10 rounded-xl border border-[#c4b5fd]/12 bg-[#171728] px-3 text-xs text-[#a1a1b5] outline-none"><option>All risk levels</option><option>High</option><option>Medium</option><option>Low</option></select></div></div></GlassCard>
    <section data-testid="risk-primary-grid" className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.7fr]"><GlassCard className="p-5"><ChartTitle eyebrow="risk trajectory" title={`${mode === "academic" ? "Academic" : "Placement"} exposure over time`} detail="% of profiles below readiness threshold" /><div data-testid="risk-trend-chart" className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="riskExposureGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FB7185" stopOpacity={0.28} /><stop offset="100%" stopColor="#FB7185" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(196,181,253,0.08)" vertical={false} /><XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fill: "#6e6e85", fontSize: 10 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#6e6e85", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="exposure" name="At risk %" stroke="#FB7185" fill="url(#riskExposureGradient)" strokeWidth={2} /><Area type="monotone" dataKey="severe" name="High risk %" stroke="#FBBF24" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" /></AreaChart></ResponsiveContainer></div></GlassCard><GlassCard className="p-5"><ChartTitle eyebrow="current posture" title="Risk distribution" detail={mode === "academic" ? "Academic readiness" : "Placement readiness"} /><div data-testid="risk-posture-donut" className="relative h-[215px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" innerRadius={60} outerRadius={86} paddingAngle={4} stroke="none">{distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span data-testid="risk-posture-count" className="font-mono text-3xl font-semibold">{highCount}</span><span className="font-mono text-[9px] uppercase tracking-widest text-rose-200">high risk</span></div></div><div className="grid grid-cols-3 gap-2">{distribution.map((entry) => <div data-testid={`risk-distribution-${entry.name.toLowerCase()}`} key={entry.name} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center"><span className="block font-mono text-sm">{entry.value}</span><span className="font-mono text-[9px] uppercase" style={{ color: entry.color }}>{entry.name}</span></div>)}</div></GlassCard></section>
    <section data-testid="risk-secondary-grid" className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]"><GlassCard className="p-5"><ChartTitle eyebrow="exposure matrix" title="Department × semester heatmap" detail="High-risk share by cohort" /><div data-testid="risk-command-heatmap" className="overflow-x-auto"><div className="min-w-[580px] space-y-2"><div className="grid grid-cols-[58px_repeat(8,minmax(0,1fr))] gap-1.5"><span />{Array.from({ length: 8 }, (_, index) => <span data-testid={`risk-heatmap-semester-${index + 1}`} key={index} className="text-center font-mono text-[9px] text-[#6e6e85]">S{index + 1}</span>)}</div>{visibleDepartments.map((dept) => <div key={dept} className="grid grid-cols-[58px_repeat(8,minmax(0,1fr))] items-center gap-1.5"><span data-testid={`risk-heatmap-label-${dept.toLowerCase()}`} className="font-mono text-[10px] text-[#a1a1b5]">{dept}</span>{Array.from({ length: 8 }, (_, index) => { const group = response.signals.filter((signal) => signal.department === dept && signal.semester === index + 1); const count = group.filter((signal) => riskFor(signal, mode) === "High").length; const ratio = count / Math.max(1, group.length); return <button data-testid={`risk-heatmap-${dept.toLowerCase()}-${index + 1}`} onClick={() => { setDepartment(dept); setRisk(count ? "High" : "All risk levels"); }} key={index} title={`${dept} S${index + 1}: ${count} high risk`} className="h-9 rounded-lg border border-white/[0.05] transition-transform hover:scale-105" style={{ backgroundColor: `rgba(251,113,133,${0.08 + ratio * 0.78})` }}><span className="font-mono text-[9px] text-[#f5f3ff]">{count}</span></button>; })}</div>)}<div className="flex justify-between pt-2 font-mono text-[9px] uppercase tracking-wider text-[#6e6e85]"><span>lower exposure</span><span>higher exposure</span></div></div></div></GlassCard><GlassCard className="overflow-hidden"><div className="p-5 pb-3"><ChartTitle eyebrow="priority queue" title="Highest-risk students" detail="Ranked by severity and readiness" /></div><div data-testid="highest-risk-list" className="divide-y divide-white/[0.05]">{ranked.map((signal, index) => <button data-testid={`risk-student-${signal.id}`} onClick={() => navigate(`/students/${signal.id}`)} key={signal.id} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.035]"><span data-testid={`risk-rank-${signal.id}`} className="w-5 font-mono text-[10px] text-[#6e6e85]">{String(index + 1).padStart(2, "0")}</span><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c4b5fd]/10 font-mono text-[9px] text-[#c4b5fd]">{signal.name.split(" ").map((part) => part[0]).join("")}</div><div className="min-w-0 flex-1"><p data-testid={`risk-student-name-${signal.id}`} className="truncate text-xs font-medium text-[#f5f3ff]">{signal.name}</p><p data-testid={`risk-student-meta-${signal.id}`} className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#6e6e85]">{signal.department} · S{signal.semester} · {mode === "academic" ? `${signal.attendance}% attendance` : `${signal.skills}% skills`}</p></div><span data-testid={`risk-readiness-${signal.id}`} className="font-mono text-xs text-[#a1a1b5]">{readinessFor(signal, mode)}</span><RiskBadge risk={riskFor(signal, mode)} /><ArrowRight size={14} className="text-[#6e6e85]" /></button>)}</div>{ranked.length === 0 && <div data-testid="risk-empty-state" className="p-12 text-center"><TrendingDown size={24} className="mx-auto text-emerald-200" /><p data-testid="risk-empty-title" className="mt-3 text-sm font-medium">No risk signals match this view.</p><p data-testid="risk-empty-copy" className="mt-1 text-xs text-[#6e6e85]">Reset a filter to widen the cohort.</p></div>}</GlassCard></section>
  </div></div>;
}

function RiskKpi({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof ShieldAlert; tone: "purple" | "rose" | "amber" | "green" }) {
  const tones = { purple: "bg-[#c4b5fd]/10 text-[#c4b5fd]", rose: "bg-rose-300/10 text-rose-200", amber: "bg-amber-300/10 text-amber-200", green: "bg-emerald-300/10 text-emerald-200" };
  return <GlassCard data-testid={`risk-kpi-${label.toLowerCase().replaceAll(" ", "-")}`} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#6e6e85]">{label}</p><p data-testid={`risk-kpi-value-${label.toLowerCase().replaceAll(" ", "-")}`} className="mt-3 font-mono text-2xl font-semibold sm:text-3xl">{value}</p><p className="mt-2 text-[10px] text-[#6e6e85] sm:text-xs">{detail}</p></div><div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={16} /></div></div></GlassCard>;
}

function ChartTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="mb-4 flex items-start justify-between gap-4"><div><p data-testid={`risk-section-${eyebrow.replaceAll(" ", "-")}`} className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#6e6e85]">{eyebrow}</p><h2 className="mt-1 text-base font-medium text-[#f5f3ff]">{title}</h2></div><span className="hidden rounded-full border border-[#c4b5fd]/10 px-2.5 py-1 font-mono text-[9px] text-[#6e6e85] sm:block">{detail}</span></div>;
}