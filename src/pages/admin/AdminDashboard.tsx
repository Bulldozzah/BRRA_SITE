import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Building2, GraduationCap, Briefcase, Users, UserCog } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <AdminLayout activeTab="overview">
      <OverviewContent />
    </AdminLayout>
  );
}

function OverviewContent() {
  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [depts, grades, positions, staff, users] = await Promise.all([
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("grades").select("id", { count: "exact", head: true }),
        supabase.from("positions").select("id", { count: "exact", head: true }),
        supabase.from("staff_profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        departments: depts.count ?? 0,
        grades: grades.count ?? 0,
        positions: positions.count ?? 0,
        staff: staff.count ?? 0,
        users: users.count ?? 0,
      };
    },
  });

  const cards: { label: string; count: number; path: string; icon: React.ElementType; desc: string }[] = [
    { label: "Departments", count: stats?.departments ?? 0, path: "/portal/admin/departments", icon: Building2, desc: "Manage organisational departments" },
    { label: "Grades", count: stats?.grades ?? 0, path: "/portal/admin/grades", icon: GraduationCap, desc: "Define salary and seniority grades" },
    { label: "Positions", count: stats?.positions ?? 0, path: "/portal/admin/positions", icon: Briefcase, desc: "Job titles and positions" },
    { label: "Staff Profiles", count: stats?.staff ?? 0, path: "/portal/admin/staff", icon: Users, desc: "Employee profiles and assignments" },
    { label: "Registered Users", count: stats?.users ?? 0, path: "/portal/admin/users", icon: UserCog, desc: "Portal users and role assignments" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 mb-2">Dashboard Overview</p>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to the Admin Console</h2>
        <p className="text-gray-600 mt-2">Manage departments, grades, positions, staff profiles and user roles from here.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link
            key={c.path}
            to={c.path}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-amber-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <c.icon className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-amber-600">{c.count}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">{c.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
