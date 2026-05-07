import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import StaffTab from "./StaffTab";

export default function AdminStaffPage() {
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
    <AdminLayout activeTab="staff">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Profiles</h2>
          <p className="text-gray-600 mt-1">Employee profiles and assignments</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <StaffTab />
        </div>
      </div>
    </AdminLayout>
  );
}
