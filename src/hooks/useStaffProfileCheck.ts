import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook that checks if the current staff user has a complete profile.
 * If the profile is incomplete (missing phone, department, or position),
 * redirects them to /portal/staff/profile to complete it.
 * 
 * Does NOT redirect if the user is already on the profile page.
 */
export function useStaffProfileCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: staffProfile, isLoading } = useQuery({
    queryKey: ["staff_profile_check", user?.id],
    enabled: !!user && (user.role === "staff" || user.role === "admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, phone, department_id, position_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const isProfilePage = location.pathname === "/portal/staff/profile";
  const isIncomplete = staffProfile && (!staffProfile.phone || !staffProfile.department_id || !staffProfile.position_id);

  useEffect(() => {
    if (isLoading || !user || isProfilePage) return;
    if (user.role !== "staff") return;

    // If staff profile exists but is incomplete, redirect to profile page
    if (isIncomplete) {
      navigate("/portal/staff/profile", { replace: true });
    }
  }, [isLoading, user, staffProfile, isIncomplete, isProfilePage, navigate]);

  return { staffProfile, isLoading, isIncomplete: !!isIncomplete };
}
