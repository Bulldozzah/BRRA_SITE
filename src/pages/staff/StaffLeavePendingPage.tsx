import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import StaffLayout from "@/components/layout/StaffLayout";
import StaffLeaveApprovalsPage from "./StaffLeaveApprovalsPage";

// This page re-uses the approvals page but pre-filters to "pending"
// Since the StaffLeaveApprovalsPage already handles this, we wrap it with the correct tab
export default function StaffLeavePendingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role !== "staff" && user.role !== "admin") navigate("/portal/dashboard");
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || (user.role !== "staff" && user.role !== "admin")) return null;

  // Redirect to the approvals page which has filtering built in
  useEffect(() => {
    navigate("/portal/staff/leave/approvals");
  }, [navigate]);

  return null;
}
