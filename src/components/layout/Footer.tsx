import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import brraLogo from "@/assets/brra-logo.jpg";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white text-foreground mt-24">
      <div className="container-wide py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={brraLogo} alt="BRRA - Business Regulatory Review Agency" className="h-14 w-auto mb-5 bg-white p-2 rounded-sm" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Business Regulatory Review Agency promotes a conducive business regulatory environment in Zambia.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary mb-5">About</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About BRRA</Link></li>
              <li><Link to="/board" className="hover:text-primary transition-colors">Board</Link></li>
              <li><Link to="/management" className="hover:text-primary transition-colors">Management</Link></li>
              <li><Link to="/departments" className="hover:text-primary transition-colors">Departments</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary mb-5">Services</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/services" className="hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link to="/e-services" className="hover:text-primary transition-colors">e-Services</Link></li>
              <li><Link to="/ria" className="hover:text-primary transition-colors">RIA</Link></li>
              <li><Link to="/rsc" className="hover:text-primary transition-colors">RSCs</Link></li>
              <li><Link to="/ria-tracking" className="hover:text-primary transition-colors">Track RIA</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary mb-5">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>Plot No. 2251, Fairley Road, Ridgeway, Lusaka</span></li>
              <li className="flex gap-2.5"><Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>+260 211 259165</span></li>
              <li className="flex gap-2.5"><Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>info@brra.org.zm</span></li>
              <li className="flex gap-2.5"><Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>Mon – Fri, 08:00 – 17:00</span></li>
            </ul>
          </div>
        </div>

        <div className="hairline mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Business Regulatory Review Agency. All rights reserved.</p>
          <p>Ministry of Commerce, Trade and Industry · Republic of Zambia</p>
        </div>
      </div>
    </footer>
  );
}
