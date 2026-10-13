import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import RiskSignals from "@/pages/RiskSignals";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<RequireAuth><AppShell /></RequireAuth>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/students/:studentId" element={<StudentProfile />} />
      <Route path="/risk" element={<RiskSignals />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
