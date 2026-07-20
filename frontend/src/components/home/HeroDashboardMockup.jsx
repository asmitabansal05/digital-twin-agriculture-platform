import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  CloudSun,
  Droplets,
  MapPin,
  Thermometer,
  Waves,
} from "lucide-react";

const sensorCards = [
  { icon: Thermometer, label: "Temperature", value: "28.4 C", tone: "text-warning" },
  { icon: Droplets, label: "Humidity", value: "72%", tone: "text-agri-water" },
  { icon: Waves, label: "Soil Moisture", value: "61%", tone: "text-success" },
];

function HeroDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative"
    >
      <div className="absolute -left-10 top-16 h-32 w-32 rounded-full bg-agri-mint blur-3xl" />
      <div className="absolute -right-8 bottom-10 h-40 w-40 rounded-full bg-agri-water/20 blur-3xl" />

      <div className="relative rounded-[1.5rem] border border-white/70 bg-white/55 p-4 shadow-panel backdrop-blur-xl">
        <div className="rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/92 via-white/76 to-agri-field/80 p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Live Twin
              </p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">
                PAU Smart Farm
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <BrainCircuit size={24} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="relative min-h-[260px] overflow-hidden rounded-[1rem] border border-border bg-primary shadow-soft">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_46px),linear-gradient(45deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_42px)]" />
              <div className="absolute inset-x-6 top-8 h-24 rounded-full bg-agri-leaf/80 blur-2xl" />
              <div className="absolute left-6 top-7 h-24 w-32 rounded-[1.1rem] border border-white/25 bg-agri-leaf/80 rotate-[-8deg]" />
              <div className="absolute right-8 top-14 h-28 w-36 rounded-[1.1rem] border border-white/25 bg-accent/80 rotate-[10deg]" />
              <div className="absolute bottom-8 left-14 h-28 w-44 rounded-[1.2rem] border border-white/25 bg-agri-soil/65 rotate-[4deg]" />
              <div className="absolute bottom-9 right-10 h-20 w-28 rounded-[1rem] border border-white/25 bg-agri-leaf/70 rotate-[-12deg]" />

              <div className="absolute left-[46%] top-[45%] flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/50 bg-white text-primary shadow-panel">
                <MapPin size={22} />
              </div>
              <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-primary shadow-soft backdrop-blur">
                Farm map preview
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1rem] border border-border bg-white/78 p-5 shadow-soft backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      AI Health Score
                    </p>
                    <p className="mt-2 text-4xl font-bold text-foreground">95%</p>
                  </div>
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(hsl(var(--success))_0_342deg,hsl(var(--muted))_342deg_360deg)]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-success shadow-sm">
                      <Activity size={25} />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Crop condition stable with low irrigation risk.
                </p>
              </div>

              <div className="rounded-[1rem] border border-border bg-primary p-5 text-primary-foreground shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Weather Signal</p>
                    <p className="mt-1 text-2xl font-bold">Optimal</p>
                  </div>
                  <CloudSun size={32} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {sensorCards.map(({ icon: Icon, label, value, tone }) => (
              <div
                key={label}
                className="rounded-[1rem] border border-white/70 bg-white/78 p-4 shadow-soft backdrop-blur"
              >
                <div className={`mb-3 ${tone}`}>
                  <Icon size={24} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HeroDashboardMockup;
