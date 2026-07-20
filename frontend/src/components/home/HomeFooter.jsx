import { Leaf } from "lucide-react";

const technologies = ["React", "Spring Boot", "PostgreSQL", "Python", "Machine Learning", "Recharts"];

function HomeFooter() {
  return (
    <footer className="border-t border-border bg-white/70 px-5 py-10 backdrop-blur sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf size={21} />
            </span>
            <div>
              <h2 className="text-title-md text-foreground">AgriTwin</h2>
              <p className="text-base text-muted-foreground">
                Digital Twin Agriculture Platform
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Copyright 2026 Digital Twin Agriculture Platform. All rights reserved.
          </p>
        </div>

        <div className="max-w-xl">
          <p className="mb-3 text-caption uppercase tracking-[0.18em] text-primary">
            Technologies Used
          </p>
          <div className="flex flex-wrap gap-2">
            {technologies.map((technology) => (
              <span
                key={technology}
                className="rounded-full border border-border bg-white px-3 py-1 text-sm font-semibold text-muted-foreground"
              >
                {technology}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;
