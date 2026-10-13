import { motion } from "motion/react";

export function ScoreRing({ score, size = 126 }: { score: number; size?: number }) {
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  return <div data-testid="success-score-ring" className="relative shrink-0" style={{ width: size, height: size }}>
    <svg width={size} height={size} className="-rotate-90" aria-label={`Success score ${score}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(196,181,253,0.10)" strokeWidth="8" />
      <motion.circle initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 1.1, ease: "easeOut" }} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#C4B5FD" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} />
    </svg>
    <div data-testid="success-score-value" className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-3xl font-bold tracking-tight text-[#f5f3ff]">{score}</span><span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a1a1b5]">score</span></div>
  </div>;
}