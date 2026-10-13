import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, CircleHelp, Search, X } from "lucide-react";

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = "faq" | "contact";

// Answers mirror the real logic in lib/scoring.ts and backend/lib/scoring.py — update them together.
const faqs = [
  {
    q: "How is the Student Success Score calculated?",
    a: "It is a weighted score out of 100: CGPA 25%, attendance 20%, LMS activity 15%, skills 15%, placement readiness 15% and engagement 10%. It is recalculated whenever a student is added or their metrics are updated.",
  },
  {
    q: "What do the Academic and Placement risk levels mean?",
    a: "Academic risk combines CGPA (55%) and attendance (45%). Placement risk combines skills (42%), placement readiness (38%) and engagement (20%). For both, a result below 45 is High risk, 45–70 is Medium and above 70 is Low.",
  },
  {
    q: "How does Student Segmentation work?",
    a: "Each student is placed in one segment by rule: Placement Ready, Academic Stars, Low Attendance, High CGPA · Low Skills, At Risk or Well-Rounded. The first matching rule wins, so a student only appears in one segment.",
  },
  {
    q: "How is the trend (up / down / steady) decided?",
    a: "The trend compares a student's current success score with their previous semester. A change of 2 points or more is up or down; anything smaller is steady. A new student shows steady until a second semester is recorded.",
  },
  {
    q: "How do I add a student or update their marks?",
    a: "On the Students page choose Add student and enter the essentials — the score, risk, segment and history are calculated for you. To change an existing student, open their profile and choose Update metrics. Faculty can only manage students in their own department.",
  },
  {
    q: "Can I import many students at once?",
    a: "Yes. On the Students page use Import CSV. Download the Sample CSV first to see the expected columns.",
  },
];

const issueTypes = ["Dashboard data sync error", "Risk flag calculation inquiry", "Report feature bug", "Other help"];

const fieldClass = "w-full rounded-xl border border-[#c4b5fd]/15 bg-white/[0.035] px-3 py-2.5 text-sm text-[#f5f3ff] outline-none placeholder:text-[#6e6e85] focus:border-[#c4b5fd]/50";

export default function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HelpTab>("faq");
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? faqs.filter((item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)) : faqs;
  }, [searchQuery]);

  if (!isOpen) return null;

  const close = () => { setSubmitted(false); setSearchQuery(""); setActiveTab("faq"); onClose(); };
  const submit = (event: FormEvent) => { event.preventDefault(); setSubmitted(true); };

  return <div data-testid="help-center-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div data-testid="help-center-modal" role="dialog" aria-modal="true" aria-label="Help center" className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#c4b5fd]/20 bg-[#12121f] text-[#f5f3ff] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#c4b5fd]/10 px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]">help center</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Faculty Help Center</h2>
          <p className="mt-1 text-xs text-[#a1a1b5]">Guides, FAQs and support for the Success Copilot</p>
        </div>
        <button data-testid="help-center-close-icon" type="button" onClick={close} aria-label="Close help center" className="rounded-lg p-1.5 text-[#6e6e85] hover:text-[#f5f3ff]"><X size={16} /></button>
      </div>

      <div className="flex gap-1 border-b border-[#c4b5fd]/10 px-4">
        {([["faq", "Frequently asked questions"], ["contact", "Contact support"]] as const).map(([tab, label]) =>
          <button key={tab} data-testid={`help-tab-${tab}`} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${activeTab === tab ? "border-[#c4b5fd] text-[#c4b5fd]" : "border-transparent text-[#a1a1b5] hover:text-[#f5f3ff]"}`}>{label}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "faq" ? <div>
          <div className="relative mb-4"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e85]" /><input data-testid="help-search-input" type="text" placeholder="Search help topics…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className={`${fieldClass} pl-9`} /></div>
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => <div key={faq.q} data-testid="help-faq-item" className="rounded-xl border border-[#c4b5fd]/10 bg-white/[0.03] p-4">
              <h4 className="mb-1.5 flex items-start gap-2 text-sm font-semibold text-[#f5f3ff]"><CircleHelp size={15} className="mt-0.5 shrink-0 text-[#c4b5fd]" />{faq.q}</h4>
              <p className="pl-[23px] text-xs leading-relaxed text-[#a1a1b5]">{faq.a}</p>
            </div>) : <p data-testid="help-no-results" className="py-6 text-center text-sm text-[#6e6e85]">No matching topics found.</p>}
          </div>
        </div> : submitted ? <div data-testid="help-ticket-sent" className="py-8 text-center">
          <CheckCircle2 size={36} className="mx-auto text-emerald-300" />
          <h3 className="mt-3 text-lg font-semibold">Support request sent</h3>
          <p className="mt-1 text-xs text-[#a1a1b5]">Our team will look into your issue shortly.</p>
          <button type="button" onClick={close} className="mt-5 rounded-xl bg-[#c4b5fd] px-4 py-2 text-xs font-semibold text-[#0b0b14] hover:bg-[#ddd6fe]">Close help center</button>
        </div> : <form data-testid="help-ticket-form" onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#6e6e85]">Issue type</span><select data-testid="help-issue-type" className={`${fieldClass} bg-[#171728]`}>{issueTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#6e6e85]">Description</span><textarea data-testid="help-description" rows={4} required placeholder="Describe what isn't working…" className={fieldClass} /></label>
          <button data-testid="help-submit-ticket" type="submit" className="w-full rounded-xl bg-[#c4b5fd] py-2.5 text-sm font-semibold text-[#0b0b14] hover:bg-[#ddd6fe]">Submit ticket</button>
        </form>}
      </div>

      <div className="flex justify-end border-t border-[#c4b5fd]/10 px-6 py-3">
        <button data-testid="help-center-close" type="button" onClick={close} className="rounded-xl border border-[#c4b5fd]/15 px-4 py-2 text-xs text-[#a1a1b5] hover:text-[#f5f3ff]">Close</button>
      </div>
    </div>
  </div>;
}
