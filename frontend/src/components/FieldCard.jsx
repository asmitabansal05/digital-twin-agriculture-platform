import { motion } from "framer-motion";
import { MapPin, Ruler, Sprout } from "lucide-react";

function FieldCard({ field }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="rounded-lg border border-white/70 bg-white/82 p-6 shadow-soft backdrop-blur transition hover:border-primary/25 hover:shadow-panel"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Field
          </p>
          <h3 className="mt-1 text-xl font-bold text-foreground">
            {field.field_name}
          </h3>
        </div>
        <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-bold text-success">
          Active
        </span>
      </div>

      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-agri-mint px-3 py-1.5 text-sm font-bold text-primary">
        <Sprout size={16} />
        {field.crop_type}
      </div>

      <div className="grid gap-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/45 px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <Ruler size={16} />
            Area
          </span>
          <strong className="text-foreground">{field.area} acres</strong>
        </div>
        <div className="rounded-lg bg-muted/45 px-4 py-3">
          <span className="mb-2 inline-flex items-center gap-2">
            <MapPin size={16} />
            Coordinates
          </span>
          <p className="font-semibold text-foreground">
            {field.latitude}, {field.longitude}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default FieldCard;
