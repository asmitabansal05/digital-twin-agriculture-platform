import { motion } from "framer-motion";

function StatCard({ value, label, description }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45 }}
      className="rounded-lg border border-white/70 bg-white/75 p-6 text-center shadow-soft backdrop-blur"
    >
      <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
        {value}
      </p>
      <h3 className="mt-3 text-title-md text-foreground">{label}</h3>
      <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
    </motion.article>
  );
}

export default StatCard;
