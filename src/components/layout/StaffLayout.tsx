import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useStaffProfileCheck } from "@/hooks/useStaffProfileCheck";
import {
  Users, LogOut, LayoutDashboard, Menu, PanelLeftClose, Bell,
  ExternalLink, ChevronRight, CalendarDays, CalendarPlus, ClipboardCheck,
  Clock, FileText, UserCircle, Send, Search, BarChart3,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
};

const mainNavItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/portal/staff/leave" },
  { id: "profile", label: "My Profile", icon: UserCircle, path: "/portal/staff/profile" },
];

const leaveItems: NavItem[] = [
  { id: "my-leave", label: "My Leave", icon: CalendarDays, path: "/portal/leave" },
  { id: "apply", label: "Apply for Leave", icon: CalendarPlus, path: "/portal/leave/apply" },
  { id: "annual-apply", label: "Annual Leave (BRRA)", icon: CalendarDays, path: "/portal/leave/annual/apply" },
  { id: "annual-approvals", label: "Annual Leave Approvals", icon: ClipboardCheck, path: "/portal/leave/annual/approvals" },
  { id: "approvals", label: "Leave Approvals", icon: ClipboardCheck, path: "/portal/staff/leave/approvals" },
  { id: "pending", label: "Pending Reviews", icon: Clock, path: "/portal/staff/leave/pending" },
  { id: "records", label: "Leave Records", icon: FileText, path: "/portal/staff/leave/records" },
];

const riaItems: NavItem[] = [
  { id: "ria-my", label: "My Submissions", icon: FileText, path: "/portal/ria" },
  { id: "ria-submit", label: "Submit RIA", icon: Send, path: "/portal/ria" },
  { id: "ria-track", label: "Track Submission", icon: Search, path: "/portal/ria" },
  { id: "ria", label: "RIA Management", icon: ClipboardCheck, path: "/portal/staff/ria" },
  { id: "ria-reports", label: "RIA Reports", icon: BarChart3, path: "/portal/staff/ria/reports" },
];

interface StaffLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function StaffLayout({ children, activeTab = "overview" }: StaffLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect staff with incomplete profiles to the profile page
  useStaffProfileCheck();

  const handleLogout = async () => {
    await logout();
    navigate("/portal/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-noir-elevated border-r border-border z-40 transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/40">
              <span className="font-display font-bold text-primary text-lg">B</span>
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap">
                <p className="font-display font-bold text-sm leading-none">BRRA Portal</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Staff Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors group ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                  </>
                )}
              </Link>
            );
          })}

          {/* Leave Management section divider */}
          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Leave Management</p>
            </div>
          )}
          {collapsed && <div className="border-t border-border my-2" />}

          {leaveItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors group ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                  </>
                )}
              </Link>
            );
          })}

          {/* RIA Management section divider */}
          {!collapsed && (
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">RIA Management</p>
            </div>
          )}
          {collapsed && <div className="border-t border-border my-2" />}

          {riaItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors group ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                  </>
                )}
              </Link>
            );
          })}

          {/* Back to dashboard link */}
          {!collapsed && <div className="border-t border-border my-3" />}
          {collapsed && <div className="border-t border-border my-2" />}
          <Link
            to="/portal/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-sm transition-colors"
            title={collapsed ? "Back to Dashboard" : undefined}
          >
            <ExternalLink className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
            {!collapsed && <span className="text-sm font-medium">Back to Dashboard</span>}
          </Link>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name || "Staff"}</p>
                <p className="text-[10px] text-primary uppercase tracking-wider">Staff</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-sm hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-sm hover:bg-gray-100 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <Menu className="h-5 w-5 text-gray-600" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900">Leave Management</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-sm hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Website</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
