import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import brraLogo from "@/assets/brra-logo.jpg";

const aboutLinks = [
  { to: "/about", label: "About BRRA" },
  { to: "/departments", label: "Departments" },
  { to: "/board", label: "Board" },
  { to: "/management", label: "Management" },
  { to: "/faq", label: "FAQs" },
];

const serviceLinks = [
  { to: "/services", label: "Our Services" },
  { to: "/e-services", label: "e-Services" },
  { to: "/ria", label: "RIA" },
  { to: "/rsc", label: "RSCs" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mobileAbout, setMobileAbout] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white text-foreground backdrop-blur-xl">
      <div className="container-wide flex h-20 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3">
          <img src={brraLogo} alt="BRRA - Business Regulatory Review Agency" className="h-12 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <NavItem to="/" label="Home" />
          <Dropdown label="About" links={aboutLinks} pathname={pathname} />
          <Dropdown label="Services" links={serviceLinks} pathname={pathname} />
          <NavItem to="/news" label="News" />
          <NavItem to="/information" label="Information" />
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/portal/login"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-gradient-gold text-primary-foreground rounded-sm hover:shadow-gold transition-all"
          >
            Portal Login
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <div className="container-wide py-6 space-y-1">
            <MobileLink to="/" label="Home" onClick={() => setOpen(false)} />
            <MobileGroup label="About" expanded={mobileAbout} onToggle={() => setMobileAbout(!mobileAbout)}>
              {aboutLinks.map(l => <MobileLink key={l.to} {...l} sub onClick={() => setOpen(false)} />)}
            </MobileGroup>
            <MobileGroup label="Services" expanded={mobileServices} onToggle={() => setMobileServices(!mobileServices)}>
              {serviceLinks.map(l => <MobileLink key={l.to} {...l} sub onClick={() => setOpen(false)} />)}
            </MobileGroup>
            <MobileLink to="/news" label="News" onClick={() => setOpen(false)} />
            <MobileLink to="/information" label="Information" onClick={() => setOpen(false)} />
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <Link
                to="/portal/login"
                onClick={() => setOpen(false)}
                className="block w-full text-center px-5 py-3 text-sm font-semibold bg-gradient-gold text-primary-foreground rounded-sm"
              >
                Portal Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "px-4 py-2 text-sm font-medium transition-colors relative",
          isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"
        )
      }
    >
      {label}
    </NavLink>
  );
}

function Dropdown({ label, links, pathname }: { label: string; links: { to: string; label: string }[]; pathname: string }) {
  const isActive = links.some(l => pathname === l.to);
  return (
    <div className="relative group">
      <button
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1",
          isActive ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
        )}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[220px]">
        <div className="bg-noir-elevated border border-border rounded-sm shadow-deep py-2">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-secondary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLink({ to, label, sub, onClick }: { to: string; label: string; sub?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "block py-2.5 text-sm font-medium text-foreground/85 hover:text-primary",
        sub && "pl-4 text-foreground/70"
      )}
    >
      {label}
    </Link>
  );
}

function MobileGroup({ label, expanded, onToggle, children }: { label: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between py-2.5 text-sm font-medium">
        <span>{label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  );
}
