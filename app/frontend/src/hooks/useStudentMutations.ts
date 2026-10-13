import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Student } from "@/types/student";
import { ApiError, apiPatch, apiPost } from "@/lib/api";

export interface NewStudentInput {
  name: string;
  rollNo: string;
  email: string;
  department: string;
  section?: string;
  semester: number;
  cgpa: number;
  attendance: number;
  lms: number;
  skills: number;
  placement: number;
  engagement: number;
  backlogs: number;
}

export type StudentMetricsInput = Partial<Pick<NewStudentInput, "semester" | "cgpa" | "attendance" | "lms" | "skills" | "placement" | "engagement" | "backlogs">>;

// FastAPI returns {detail: "text"} for 4xx and {detail: [{loc, msg}]} for 422 validation errors.
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => `${String(item?.loc?.slice(-1)?.[0] ?? "field")}: ${String(item?.msg ?? "invalid")}`).join("; ");
    if (error.status === 401) return "Your session expired. Please sign in again.";
    if (error.status === 403) return "You don't have permission to do that.";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

// Scores, risk, segment, trend and history are recalculated by the backend — refresh everything that shows them.
function useRefreshStudentData() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["students"] }),
    queryClient.invalidateQueries({ queryKey: ["student"] }),
    queryClient.invalidateQueries({ queryKey: ["risk-signals"] }),
  ]);
}

export function useCreateStudent() {
  const refresh = useRefreshStudentData();
  return useMutation({ mutationFn: (input: NewStudentInput) => apiPost<Student>("/students", input), onSuccess: refresh });
}

export function useUpdateStudentMetrics(studentId: string) {
  const refresh = useRefreshStudentData();
  return useMutation({ mutationFn: (input: StudentMetricsInput) => apiPatch<Student>(`/students/${studentId}`, input), onSuccess: refresh });
}
