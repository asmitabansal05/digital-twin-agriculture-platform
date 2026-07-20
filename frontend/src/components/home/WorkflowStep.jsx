import { motion } from "framer-motion";

function WorkflowStep({ icon: Icon, step, title, description }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-lg border border-border bg-card p-7 shadow-soft"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-agri-mint text-primary">
          <Icon size={27} />
        </div>
        <span className="text-caption text-muted-foreground">{step}</span>
      </div>
      <h3 className="text-title-md text-foreground">{title}</h3>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
    </motion.article>
  );
}

export default WorkflowStep;
