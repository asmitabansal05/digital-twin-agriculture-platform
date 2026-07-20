import { cn } from "../../lib/utils";

function LandingSection({ id, eyebrow, title, description, children, className }) {
  return (
    <section id={id} className={cn("px-5 py-24 sm:px-8 lg:px-12", className)}>
      <div className="mx-auto max-w-7xl">
        {(eyebrow || title || description) && (
          <div className="mx-auto mb-14 max-w-3xl text-center">
            {eyebrow && (
              <p className="mb-3 text-caption uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default LandingSection;
