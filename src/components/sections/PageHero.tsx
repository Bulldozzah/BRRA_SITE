import { ReactNode } from "react";

export default function PageHero({ eyebrow, title, description, children, backgroundImage }: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  backgroundImage?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {backgroundImage ? (
        <>
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/80 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-noir" />
      )}
      {!backgroundImage && (
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--gold)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--gold-bright)) 0%, transparent 40%)`
        }} />
      )}
      <div className="container-wide relative py-20 lg:py-28">
        {eyebrow && <div className="eyebrow mb-4 animate-fade-up">{eyebrow}</div>}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-4xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {description}
          </p>
        )}
        {children && <div className="mt-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>{children}</div>}
      </div>
    </section>
  );
}
