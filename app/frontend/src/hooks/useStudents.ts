import { useQuery } from "@tanstack/react-query";
import type { Student } from "@/types/student";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function useStudents() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["students", user?.role, user?.department],
    queryFn: () => apiGet<Student[]>("/students"),
    enabled: Boolean(user),
    retry: 1,
  });
  return { students: query.data ?? [], isLoading: query.isLoading, isError: query.isError, error: query.error };
}

export function useStudent(studentId: string | undefined) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => apiGet<Student>(`/students/${studentId}`),
    enabled: Boolean(studentId) && Boolean(user),
    retry: 1,
  });
  return { student: query.data, isLoading: query.isLoading, isError: query.isError };
}
