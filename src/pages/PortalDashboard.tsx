import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/context/AuthContext";
import { Shield, Users, FileText, LogOut, Settings, Activity, ClipboardList, CalendarDays, UserCircle } from "lucide-react";

export default function PortalDashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/portal/login");
    else if (user.role === "admin") navigate("/portal/admin");
  }, [user, loading, navigate]);

  if (!user) return null;

  const roleStyles: Record<string, string> = {
    admin: "bg-gradient-gold text-primary-foreground",
    staff: "bg-primary/20 text-primary border border-primary/40",
    user: "bg-secondary text-foreground border border-border",
  };

  return (
    <PageLayout>
      <section className="container-wide py-16">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Portal Dashboard</p>
            <h1 className="font-display text-4xl font-bold mb-2">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm ${roleStyles[user.role]}`}>
              {user.role}
            </span>
            <button
              onClick={async () => { await logout(); navigate("/portal/login"); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border border-border hover:border-primary hover:text-primary rounded-sm transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {getCards(user.role).map((c) => (
            <Link key={c.title} to={c.path || "#"} className="bg-noir-elevated/40 p-8 hover:bg-noir-elevated/70 transition-colors">
              <c.icon className="h-7 w-7 text-primary mb-5" />
              <h3 className="font-display text-lg font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

function getCards(role: string) {
  const common = [
    { icon: FileText, title: "My Submissions", desc: "View RIA submissions and track their review status.", path: "/portal/ria" },
    { icon: Activity, title: "Recent Activity", desc: "Updates on licenses, permits and notifications.", path: "#" },
    { icon: CalendarDays, title: "Leave Management", desc: "Apply for leave, view balances and track applications.", path: "/portal/leave" },
  ];
  if (role === "admin") {
    return [
      { icon: Shield, title: "Admin Console", desc: "Full system access, role assignments and audit logs.", path: "/portal/admin" },
      { icon: Users, title: "User Management", desc: "Manage staff accounts, registrations and access.", path: "/portal/admin/users" },
      { icon: Settings, title: "System Settings", desc: "Configure portal-wide options and integrations.", path: "#" },
      ...common,
      { icon: ClipboardList, title: "All RIA Reviews", desc: "Approve, reject or comment on submitted RIAs.", path: "/portal/staff/ria" },
    ];
  }
  if (role === "staff") {
    return [
      { icon: UserCircle, title: "My Profile", desc: "View and complete your staff profile information.", path: "/portal/staff/profile" },
      { icon: ClipboardList, title: "Review Queue", desc: "Process pending RIA submissions assigned to you.", path: "/portal/staff/ria" },
      { icon: CalendarDays, title: "Leave Dashboard", desc: "Manage leave applications, approvals and records.", path: "/portal/staff/leave" },
      { icon: Users, title: "Stakeholders", desc: "Communicate with applicants and regulatory bodies.", path: "#" },
      ...common,
    ];
  }
  return [
    ...common,
    { icon: Settings, title: "Account Settings", desc: "Update your profile and notification preferences.", path: "#" },
  ];
}