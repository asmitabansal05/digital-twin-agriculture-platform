import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

function TechCard({ icon: Icon, name, detail, className }) {
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "rounded-lg border border-border bg-white/80 p-6 shadow-soft backdrop-blur transition hover:border-primary/30 hover:shadow-panel",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon size={26} />
        </div>
        <div>
          <h3 className="text-title-md text-foreground">{name}</h3>
          <p className="text-base text-muted-foreground">{detail}</p>
        </div>
      </div>
    </motion.article>
  );
}

export default TechCard;
