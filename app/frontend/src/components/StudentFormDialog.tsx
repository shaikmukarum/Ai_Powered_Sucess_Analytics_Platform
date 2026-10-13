import { useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { RiskBadge } from "@/components/RiskBadge";
import { departments, sections, type Student } from "@/types/student";
import { apiErrorMessage, useCreateStudent, useUpdateStudentMetrics, type NewStudentInput } from "@/hooks/useStudentMutations";
import { useAuth } from "@/lib/auth";
import { evaluateMetrics } from "@/lib/scoring";

type MetricKey = "cgpa" | "attendance" | "lms" | "skills" | "placement" | "engagement" | "backlogs";

const metricFields: { key: MetricKey; label: string; max: number; step: number; hint: string }[] = [
  { key: "cgpa", label: "CGPA", max: 10, step: 0.1, hint: "0 – 10" },
  { key: "attendance", label: "Attendance %", max: 100, step: 1, hint: "0 – 100" },
  { key: "lms", label: "LMS activity %", max: 100, step: 1, hint: "0 – 100" },
  { key: "skills", label: "Skills %", max: 100, step: 1, hint: "0 – 100" },
  { key: "placement", label: "Placement readiness %", max: 100, step: 1, hint: "0 – 100" },
  { key: "engagement", label: "Engagement %", max: 100, step: 1, hint: "0 – 100" },
  { key: "backlogs", label: "Backlogs", max: 50, step: 1, hint: "count" },
];

const inputClass = "h-10 w-full rounded-xl border border-[#c4b5fd]/15 bg-white/[0.035] px-3 text-sm text-[#f5f3ff] outline-none placeholder:text-[#6e6e85] focus:border-[#c4b5fd]/50";
const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#6e6e85]";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog edits that student's metrics instead of creating a new student. */
  student?: Student;
  onCreated?: (student: Student) => void;
}

export function StudentFormDialog(props: Props) {
  // Remount the form each time it opens so fields always start from fresh defaults.
  return props.open ? <StudentForm {...props} /> : null;
}

function StudentForm({ onClose, student, onCreated }: Props) {
  const { user } = useAuth();
  const isEdit = Boolean(student);
  const lockedDepartment = user?.role === "faculty" ? user.department : undefined;
  const create = useCreateStudent();
  const update = useUpdateStudentMetrics(student?.id ?? "");

  const [text, setText] = useState({ name: "", rollNo: "", email: "" });
  const [department, setDepartment] = useState<string>(student?.department ?? lockedDepartment ?? departments[0]);
  const [semester, setSemester] = useState(String(student?.semester ?? 1));
  const [section, setSection] = useState<string>(student?.section ?? sections[0]);
  const [metrics, setMetrics] = useState<Record<MetricKey, string>>({
    cgpa: student ? String(student.cgpa) : "", attendance: student ? String(student.attendance) : "", lms: student ? String(student.lms) : "",
    skills: student ? String(student.skills) : "", placement: student ? String(student.placement) : "", engagement: student ? String(student.engagement) : "",
    backlogs: student ? String(student.backlogs) : "0",
  });
  const [error, setError] = useState("");
  const pending = create.isPending || update.isPending;

  const numbers = useMemo(() => {
    const parsed = Object.fromEntries(metricFields.map((field) => [field.key, metrics[field.key] === "" ? NaN : Number(metrics[field.key])])) as Record<MetricKey, number>;
    return parsed;
  }, [metrics]);
  const complete = metricFields.every((field) => Number.isFinite(numbers[field.key]));
  const preview = complete ? evaluateMetrics(numbers) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    for (const field of metricFields) {
      const value = numbers[field.key];
      if (!Number.isFinite(value) || value < 0 || value > field.max) return setError(`${field.label} must be between 0 and ${field.max}.`);
    }
    try {
      if (student) {
        await update.mutateAsync({ semester: Number(semester), ...numbers });
        toast.success("Metrics updated — risk, segment and trend recalculated.");
      } else {
        if (text.name.trim().length < 2 || text.rollNo.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text.email.trim())) return setError("Enter a name, roll number and a valid email.");
        const payload: NewStudentInput = { ...text, department, section, semester: Number(semester), ...numbers };
        const created = await create.mutateAsync(payload);
        toast.success(`${created.name} added — scored ${created.successScore}, ${created.academicRisk} academic risk.`);
        onCreated?.(created);
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return <div data-testid="student-form-overlay" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <form data-testid="student-form" onSubmit={submit} className="w-full max-w-2xl rounded-2xl border border-[#c4b5fd]/20 bg-[#12121f] p-5 text-[#f5f3ff] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]">{isEdit ? "update metrics" : "new student"}</p><h2 className="mt-1 text-xl font-semibold tracking-tight">{isEdit ? `Update ${student?.name}` : "Add a student"}</h2><p className="mt-1 text-xs text-[#a1a1b5]">Enter the essentials — score, risk, segment, trend and history are calculated for you.</p></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#6e6e85] hover:text-[#f5f3ff]"><X size={16} /></button>
      </div>

      {!isEdit && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className={labelClass}>Full name</span><input data-testid="student-name-input" value={text.name} onChange={(e) => setText({ ...text, name: e.target.value })} className={inputClass} placeholder="e.g. Priya Nair" required /></label>
        <label><span className={labelClass}>Roll number</span><input data-testid="student-rollno-input" value={text.rollNo} onChange={(e) => setText({ ...text, rollNo: e.target.value })} className={inputClass} placeholder="e.g. 24CSE301" required /></label>
        <label><span className={labelClass}>Email</span><input data-testid="student-email-input" type="email" value={text.email} onChange={(e) => setText({ ...text, email: e.target.value })} className={inputClass} placeholder="name@campus.edu" required /></label>
        <label><span className={labelClass}>Department</span><select data-testid="student-department-input" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={Boolean(lockedDepartment)} className={`${inputClass} bg-[#171728] disabled:opacity-60`}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Semester</span><select data-testid="student-semester-input" value={semester} onChange={(e) => setSemester(e.target.value)} className={`${inputClass} bg-[#171728]`}>{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Section</span><select data-testid="student-section-input" value={section} onChange={(e) => setSection(e.target.value)} className={`${inputClass} bg-[#171728]`}>{sections.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>}
      {isEdit && <label className="mb-3 block sm:w-1/2"><span className={labelClass}>Semester</span><select data-testid="student-semester-input" value={semester} onChange={(e) => setSemester(e.target.value)} className={`${inputClass} bg-[#171728]`}>{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-[10px] text-[#6e6e85]">Moving to a new semester adds a point to the trajectory chart and recalculates the trend.</span></label>}

      <div className={`${isEdit ? "" : "mt-3 "}grid grid-cols-2 gap-3 sm:grid-cols-4`}>
        {metricFields.map((field) => <label key={field.key}><span className={labelClass}>{field.label}</span><input data-testid={`student-${field.key}-input`} type="number" inputMode="decimal" min={0} max={field.max} step={field.step} value={metrics[field.key]} onChange={(e) => setMetrics({ ...metrics, [field.key]: e.target.value })} className={inputClass} placeholder={field.hint} required /></label>)}
      </div>

      <div data-testid="student-form-preview" className="mt-5 rounded-xl border border-[#c4b5fd]/12 bg-white/[0.025] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e6e85]">calculated on save</p>
        {preview ? <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#a1a1b5]">
          <span>Success score <b className="ml-1 font-mono text-base text-[#c4b5fd]">{preview.successScore}</b></span>
          <span className="flex items-center gap-2">Academic <RiskBadge risk={preview.academicRisk} /></span>
          <span className="flex items-center gap-2">Placement <RiskBadge risk={preview.placementRisk} /></span>
          <span>Segment <b className="ml-1 text-[#f5f3ff]">{preview.segment}</b></span>
        </div> : <p className="mt-2 text-xs text-[#6e6e85]">Fill in all the metrics to preview the score and risk.</p>}
      </div>

      {error && <p data-testid="student-form-error" role="alert" className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs text-rose-200">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={pending} className="h-10 rounded-xl border border-[#c4b5fd]/15 px-4 text-xs text-[#a1a1b5] hover:text-[#f5f3ff] disabled:opacity-50">Cancel</button>
        <button data-testid="student-form-submit" type="submit" disabled={pending} className="h-10 rounded-xl bg-[#c4b5fd] px-5 text-xs font-semibold text-[#0b0b14] hover:bg-[#ddd6fe] disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : isEdit ? "Save changes" : "Add student"}</button>
      </div>
    </form>
  </div>;
}
