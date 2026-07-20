import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

function FeatureCard({ icon: Icon, title, description, className }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group rounded-lg border border-border bg-card p-8 text-card-foreground shadow-soft",
        "transition duration-300 hover:border-primary/35 hover:shadow-panel",
        className
      )}
    >
      <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-primary shadow-sm transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon size={31} strokeWidth={2.1} />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
    </motion.article>
  );
}

export default FeatureCard;
