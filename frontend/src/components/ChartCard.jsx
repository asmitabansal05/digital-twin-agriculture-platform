import { motion } from "framer-motion";

function ChartCard({ icon: Icon, title, subtitle, accent = "text-primary", children }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-white/70 bg-white/82 p-4 shadow-soft backdrop-blur"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Sensor Trend
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted/55 ${accent}`}>
            <Icon size={19} />
          </div>
        )}
      </div>
      <div className="h-[190px] w-full">{children}</div>
    </motion.article>
  );
}

export default ChartCard;
