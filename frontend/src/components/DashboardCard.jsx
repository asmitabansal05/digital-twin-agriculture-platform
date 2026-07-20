import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "../lib/utils";

function DashboardCard({
  title,
  value,
  unit,
  icon: Icon,
  trend = "Live",
  accent = "from-primary/12 to-agri-mint/45",
  className,
}) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/75 bg-white/82 p-4 shadow-soft backdrop-blur",
        "transition duration-300 hover:border-primary/25 hover:shadow-panel",
        className
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent)} />
      <div className={cn("absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl", accent)} />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <h3 className="text-2xl font-bold leading-none text-foreground xl:text-[1.7rem]">
              {value}
            </h3>
            {unit && (
              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-soft">
            <Icon size={21} />
          </div>
        )}
      </div>

      <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[0.7rem] font-bold text-success">
        <Activity size={12} />
        {trend}
      </div>
    </motion.article>
  );
}

export default DashboardCard;
