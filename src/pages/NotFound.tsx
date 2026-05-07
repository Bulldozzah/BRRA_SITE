import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center justify-center container-wide py-20">
        <div className="text-center max-w-md">
          <div className="font-display text-8xl font-black text-gradient-gold mb-4">404</div>
          <h1 className="font-display text-3xl font-bold mb-4">Page not found</h1>
          <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-sm hover:shadow-gold transition-all">
            Return home
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
