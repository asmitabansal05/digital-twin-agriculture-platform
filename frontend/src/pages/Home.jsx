import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Leaf,
  LineChart,
  Network,
  Play,
  Server,
  Sprout,
  Waves,
} from "lucide-react";

import FeatureCard from "../components/home/FeatureCard";
import HeroDashboardMockup from "../components/home/HeroDashboardMockup";
import HomeFooter from "../components/home/HomeFooter";
import LandingSection from "../components/home/LandingSection";
import StatCard from "../components/home/StatCard";
import TechCard from "../components/home/TechCard";
import WorkflowStep from "../components/home/WorkflowStep";

const features = [
  {
    icon: Activity,
    title: "Live Sensor Monitoring",
    description:
      "Track temperature, humidity, rainfall, and soil moisture signals as they flow from connected farm fields.",
  },
  {
    icon: BrainCircuit,
    title: "AI Health Prediction",
    description:
      "Use intelligent models to assess crop health patterns and surface early signals for intervention.",
  },
  {
    icon: LineChart,
    title: "Yield Prediction",
    description:
      "Forecast productivity with data-backed yield estimates that help teams plan inputs and operations.",
  },
  {
    icon: Waves,
    title: "Irrigation Optimization",
    description:
      "Translate field conditions into clear irrigation guidance for smarter water use and healthier crops.",
  },
  {
    icon: Cpu,
    title: "Digital Twin Simulation",
    description:
      "Model farm scenarios before acting, comparing environmental inputs against expected crop outcomes.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Bring farm, sensor, prediction, and simulation insights into one executive-grade operating view.",
  },
];

const workflow = [
  {
    icon: Gauge,
    step: "01",
    title: "Sensor Data",
    description: "Field readings capture the living state of the farm.",
  },
  {
    icon: Network,
    step: "02",
    title: "Digital Twin",
    description: "The platform mirrors field conditions in a virtual model.",
  },
  {
    icon: BrainCircuit,
    step: "03",
    title: "AI Models",
    description: "Predictions convert raw signals into agricultural insight.",
  },
  {
    icon: Sprout,
    step: "04",
    title: "Smart Decisions",
    description: "Teams act with clear recommendations and measurable context.",
  },
];

const techStack = [
  { icon: Leaf, name: "React", detail: "Responsive frontend" },
  { icon: Server, name: "Spring Boot", detail: "API services" },
  { icon: Database, name: "PostgreSQL", detail: "Farm data store" },
  { icon: GitBranch, name: "Python", detail: "AI/ML workflows" },
  { icon: BrainCircuit, name: "Machine Learning", detail: "Prediction engine" },
  { icon: LineChart, name: "Recharts", detail: "Data visualization" },
];

const stats = [
  {
    value: "3",
    label: "Smart Farms",
    description: "Connected field environments ready for digital twin monitoring.",
  },
  {
    value: "2000+",
    label: "Sensor Records",
    description: "Historical readings powering trends, forecasts, and decisions.",
  },
  {
    value: "95%",
    label: "AI Health Accuracy",
    description: "Model-driven crop health intelligence for confident planning.",
  },
  {
    value: "Real-time",
    label: "Monitoring",
    description: "Live farm signals translated into action-ready operational context.",
  },
];

function Home() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--agri-mint))_0,transparent_34%),radial-gradient(circle_at_82%_10%,hsl(var(--agri-water)/0.22)_0,transparent_28%),linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--agri-field))_48%,white_100%)]" />
        <div className="absolute left-[-6rem] top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-12 right-[-5rem] -z-10 h-80 w-80 rounded-full bg-agri-sun/20 blur-3xl" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-primary no-underline">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <Leaf size={21} />
            </span>
            <span className="font-display text-title-md text-foreground">AgriTwin</span>
          </Link>
          <div className="hidden items-center gap-8 rounded-full border border-white/70 bg-white/68 px-5 py-3 text-sm font-semibold text-muted-foreground shadow-soft backdrop-blur md:flex">
            <a className="text-inherit no-underline transition hover:text-primary" href="#features">
              Features
            </a>
            <a className="text-inherit no-underline transition hover:text-primary" href="#technology">
              Technology
            </a>
            <a className="text-inherit no-underline transition hover:text-primary" href="#about">
              About
            </a>
            <Link className="text-inherit no-underline transition hover:text-primary" to="/dashboard">
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-6 inline-flex rounded-full border border-primary/20 bg-white/75 px-5 py-2.5 text-caption uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
              AI-powered digital twin agriculture
            </p>
            <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.04] text-foreground sm:text-6xl lg:text-7xl">
              Digital Twin Agriculture Platform
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-muted-foreground">
              Unify live sensor intelligence, crop health prediction, yield forecasting,
              and simulation into a premium command center for smarter farm decisions.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground no-underline shadow-panel transition duration-300 hover:-translate-y-0.5 hover:bg-agri-canopy/90 hover:shadow-soft"
              >
                Get Started
                <ArrowRight size={20} />
              </Link>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white/82 px-8 py-4 text-base font-bold text-foreground shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-panel"
              >
                Learn More
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>

          <HeroDashboardMockup />
        </div>
      </section>

      <section className="relative px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <LandingSection
        id="features"
        eyebrow="Platform Features"
        title="Everything needed to operate a data-driven farm"
        description="Purpose-built capabilities for monitoring, prediction, simulation, and operational decisions."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="about"
        eyebrow="How It Works"
        title="From farm signals to confident decisions"
        description="A clean workflow turns field observations into digital context, AI predictions, and practical recommendations."
        className="bg-white/60"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((step) => (
            <WorkflowStep key={step.title} {...step} />
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="technology"
        eyebrow="Technology Stack"
        title="Built on reliable modern engineering"
        description="The platform combines production frontend tooling, robust backend services, relational data, and AI/ML intelligence."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {techStack.map((tech) => (
            <TechCard key={tech.name} {...tech} />
          ))}
        </div>
      </LandingSection>

      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-7xl rounded-lg bg-primary px-6 py-14 text-center text-primary-foreground shadow-panel sm:px-10"
        >
          <p className="text-caption uppercase tracking-[0.18em] opacity-80">
            Start exploring
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-display-md">
            See your agriculture intelligence command center in action.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 opacity-85">
            Move from static field readings to living digital twins, AI recommendations,
            and operational clarity for every farm.
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-bold text-primary no-underline shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-agri-field"
          >
            Open Dashboard
            <Play size={17} />
          </Link>
        </motion.div>
      </section>

      <HomeFooter />
    </main>
  );
}

export default Home;
