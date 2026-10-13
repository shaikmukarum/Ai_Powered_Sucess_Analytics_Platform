import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { apiErrorMessage, type NewStudentInput } from "@/hooks/useStudentMutations";
import { departments } from "@/types/student";

const NUMERIC = ["semester", "cgpa", "attendance", "lms", "skills", "placement", "engagement", "backlogs"] as const;
const ALIASES: Record<string, string> = { rollno: "rollNo", roll_no: "rollNo", roll: "rollNo", "roll number": "rollNo" };

// Minimal CSV parser: handles quoted fields, escaped quotes and CRLF line endings.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function toStudent(headers: string[], cells: string[]): NewStudentInput | string {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => { record[header] = cells[index] ?? ""; });
  const department = record.department?.toUpperCase();
  if (!record.name || !record.rollNo || !record.email) return "name, rollNo and email are required";
  if (!(departments as readonly string[]).includes(department)) return `department must be one of ${departments.join(", ")}`;
  const numbers: Record<string, number> = {};
  for (const key of NUMERIC) {
    const raw = record[key];
    const value = raw === "" || raw === undefined ? (key === "backlogs" ? 0 : NaN) : Number(raw);
    if (Number.isNaN(value)) return `${key} must be a number`;
    numbers[key] = value;
  }
  return { name: record.name, rollNo: record.rollNo, email: record.email, department, section: (record.section || "A").toUpperCase(), ...numbers } as NewStudentInput;
}

export function ImportStudentsButton() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const run = async (file: File) => {
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { toast.error("The CSV needs a header row and at least one student."); return; }
    const headers = rows[0].map((header) => ALIASES[header.trim().toLowerCase()] ?? header.trim());
    setBusy(true);
    const toastId = toast.loading(`Importing ${rows.length - 1} students…`);
    let created = 0;
    const problems: string[] = [];
    for (const [index, cells] of rows.slice(1).entries()) {
      const parsed = toStudent(headers, cells);
      if (typeof parsed === "string") { problems.push(`Row ${index + 2}: ${parsed}`); continue; }
      try { await apiPost("/students", parsed); created++; }
      catch (error) { problems.push(`Row ${index + 2} (${parsed.rollNo}): ${apiErrorMessage(error)}`); }
    }
    await Promise.all(["students", "student", "risk-signals"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    setBusy(false);
    if (input.current) input.current.value = "";
    const summary = `${created} imported${problems.length ? `, ${problems.length} skipped` : ""}`;
    if (problems.length) toast.warning(`${summary}. ${problems.slice(0, 3).join(" · ")}`, { id: toastId, duration: 9000 });
    else toast.success(summary, { id: toastId });
  };

  return <>
    <input ref={input} data-testid="import-students-input" type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(file); }} />
    <a data-testid="sample-csv-link" href="/sample_students.csv" download className="flex h-9 items-center gap-2 rounded-xl border border-[#c4b5fd]/15 px-3 text-xs text-[#a1a1b5] transition hover:border-[#c4b5fd]/35 hover:text-[#f5f3ff]"><Download size={14} />Sample CSV</a>
    <button data-testid="import-students-button" type="button" disabled={busy} onClick={() => input.current?.click()} className="flex h-9 items-center gap-2 rounded-xl border border-[#c4b5fd]/25 bg-[#c4b5fd]/10 px-3 text-xs font-medium text-[#c4b5fd] transition hover:bg-[#c4b5fd]/20 disabled:cursor-wait disabled:opacity-50"><Upload size={14} />{busy ? "Importing…" : "Import CSV"}</button>
  </>;
}
