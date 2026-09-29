"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  Cpu,
  DatabaseZap,
  FileCheck2,
  Globe2,
  Layers3,
  LockKeyhole,
  Mail,
  MessageSquareText,
  PlugZap,
  Play,
  Route,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Données                                                                   */
/* -------------------------------------------------------------------------- */

const navItems = [
  { label: "Plateforme", href: "#platform" },
  { label: "Agents", href: "#agents" },
  { label: "Automatisations", href: "#automations" },
  { label: "Sécurité", href: "#security" },
];

const stats = [
  { value: "24/7", label: "Exécutions récurrentes" },
  { value: "80+", label: "Actions disponibles" },
  { value: "0", label: "Répétition manuelle" },
];

const integrations = [
  { name: "Navigateur", icon: Globe2 },
  { name: "Calendrier", icon: CalendarClock },
  { name: "E-mail", icon: Mail },
  { name: "Base de données", icon: DatabaseZap },
  { name: "VM bureau", icon: Cpu },
  { name: "Workflows", icon: Workflow },
  { name: "Fichiers", icon: FileCheck2 },
  { name: "API", icon: PlugZap },
];

const features = [
  {
    title: "Planifier, naviguer, agir",
    description:
      "Orbit découpe un objectif en étapes visibles, ouvre les bons outils, rassemble le contexte et garde toujours la prochaine action claire.",
    icon: Route,
    className: "lg:col-span-2",
    visual: "plan" as const,
  },
  {
    title: "Un seul espace de travail",
    description:
      "Chat, état des tâches, fichiers, planifications et bureau en direct réunis dans un seul centre de commande.",
    icon: Layers3,
    className: "lg:row-span-2",
    visual: "workspace" as const,
  },
  {
    title: "Automatisation des routines",
    description:
      "Transformez le travail répétitif en exécutions planifiées, avec historique et points de validation humaine.",
    icon: CalendarClock,
    className: "",
    visual: null,
  },
  {
    title: "Intelligence des outils",
    description:
      "Orbit suggère le bon outil connecté au fil de la tâche, et journalise chaque appel.",
    icon: PlugZap,
    className: "",
    visual: null,
  },
  {
    title: "Mémoire sécurisée",
    description:
      "Préférences, configuration des agents et historique des exécutions restent disponibles sans noyer votre équipe dans la configuration.",
    icon: LockKeyhole,
    className: "lg:col-span-2",
    visual: null,
  },
];

const workflowSteps = [
  {
    title: "Décrivez le résultat",
    text: "Donnez un objectif à Orbit, joignez du contexte ou partez d'une routine existante.",
    icon: MessageSquareText,
  },
  {
    title: "Regardez le plan se former",
    text: "L'agent repère les outils, les dépendances et les vérifications avant d'agir.",
    icon: BrainCircuit,
  },
  {
    title: "Validez les actions clés",
    text: "Relisez les actions sensibles, les tâches planifiées et les changements d'outils externes.",
    icon: FileCheck2,
  },
  {
    title: "Obtenez le résultat",
    text: "Chaque exécution laisse une trace claire des résultats, des décisions et des prochaines étapes.",
    icon: Check,
  },
];

const routines = [
  { name: "Recherche quotidienne de leads", cadence: "Tous les jours · 06:30", status: "Planifié" },
  { name: "Brouillon du rapport hebdo", cadence: "Chaque lundi · 08:00", status: "Planifié" },
  { name: "Résumé d'incident", cadence: "Sur alerte", status: "En cours" },
];

const securityItems = [
  "Validation avant tout changement externe",
  "Historique d'exécution pour chaque tâche",
  "Authentification via l'espace de travail",
  "État des outils et contrôles de déconnexion",
];

const faqs = [
  {
    question: "Orbit peut-il exécuter des tâches d'agent récurrentes ?",
    answer:
      "Oui. Les routines peuvent être planifiées, suivies et relues grâce à l'historique d'exécution, pour que le travail répétitif reste visible.",
  },
  {
    question: "Cette page remplace-t-elle l'application ?",
    answer:
      "Non. Cette page mène à l'espace de travail existant, où se trouvent vos agents, outils, conversations et planifications.",
  },
  {
    question: "Est-ce fait pour les équipes ou pour les indépendants ?",
    answer:
      "Pour les deux. Orbit fonctionne comme un centre de commande léger pour les particuliers, les fondateurs et les équipes opérationnelles.",
  },
];

const runSteps = [
  { label: "Vérifier les nouvelles demandes clients", tool: "E-mail" },
  { label: "Résumer les nouveaux leads", tool: "Navigateur" },
  { label: "Mettre à jour le suivi du jour", tool: "Base de données" },
  { label: "Attendre votre validation", tool: "Validation" },
  { label: "Envoyer le résumé de fin", tool: "E-mail" },
];

/* -------------------------------------------------------------------------- */
/*  Petits blocs                                                              */
/* -------------------------------------------------------------------------- */

/** Grille qui s'estompe vers les bords. Utilise la couleur de bordure du thème. */
function GridBackdrop({ className }: { className?: string }) {
  const mask =
    "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 75%)";
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 size-full text-border", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <pattern id="orbit-grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M56 0H0V56" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#orbit-grid)" />
    </svg>
  );
}

/** Carte dont la bordure et le fond s'illuminent sous le curseur. */
function SpotlightCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  const mask = "radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), black, transparent 70%)";

  return (
    <Card
      onMouseMove={onMove}
      className={cn("group relative overflow-hidden transition-colors hover:border-primary/40", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </Card>
  );
}

function SectionHeading({
  badge,
  icon: Icon,
  title,
  description,
}: {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
      <Badge variant="outline" className="mb-4 h-7 gap-1.5 bg-card/50 px-3 backdrop-blur">
        <Icon className="size-3.5 text-primary" />
        {badge}
      </Badge>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Démo du hero : une exécution d'agent qui se joue étape par étape          */
/* -------------------------------------------------------------------------- */

function AgentRunDemo() {
  const total = runSteps.length;
  const [active, setActive] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) setActive(total);
  }, [total]);

  React.useEffect(() => {
    if (reduced) return;
    const delay = active === total ? 3200 : 1500;
    const t = setTimeout(() => setActive((a) => (a >= total ? 0 : a + 1)), delay);
    return () => clearTimeout(t);
  }, [active, total, reduced]);

  const progress = Math.round((active / total) * 100);

  return (
    <div className="relative">
      {/* Halo derrière la fenêtre */}
      <div
        aria-hidden
        className="absolute inset-x-10 -top-6 -z-10 h-40 rounded-full bg-primary/30 blur-[90px]"
      />

      {/* Bordure lumineuse qui tourne */}
      <div className="relative overflow-hidden rounded-2xl bg-border p-px shadow-2xl shadow-primary/10">
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <div
            className="orbit-beam aspect-square w-[200%] shrink-0"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, var(--primary) 360deg)",
            }}
          />
        </div>

        <div className="relative overflow-hidden rounded-[15px] bg-card text-left">
          {/* Barre de fenêtre */}
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="rounded-md border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              orbit.agent/run
            </div>
            <Badge variant="outline" className="gap-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              En direct
            </Badge>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.35fr_1fr]">
            {/* Journal d'exécution */}
            <div>
              <p className="text-xs text-muted-foreground">Mission en cours</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                Lancer mon suivi client en semaine
              </h3>

              <ol className="mt-5 space-y-2">
                {runSteps.map((step, i) => {
                  const done = i < active;
                  const running = i === active;
                  return (
                    <li
                      key={step.label}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500",
                        running
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent bg-muted/40",
                        !done && !running && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {done ? (
                          <Check className="size-3.5" />
                        ) : running ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : null}
                      </span>
                      <span className="flex-1 text-sm">{step.label}</span>
                      <Badge variant="outline" className="hidden text-muted-foreground sm:inline-flex">
                        {step.tool}
                      </Badge>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Panneaux latéraux */}
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="size-4 text-primary" />
                  Planification
                </div>
                <p className="mt-2 text-sm text-muted-foreground">En semaine à 09:00</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Progression</span>
                  <span className="tabular-nums text-muted-foreground">{progress}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg border p-4 transition-colors duration-500",
                  active === 3 ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30",
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" />
                  Point de validation
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {active === 3
                    ? "En attente de votre validation avant l'envoi."
                    : active > 3
                      ? "Validé. Résumé envoyé."
                      : "S'ouvre avant tout envoi."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-background text-foreground">
      <style>{`
        @keyframes orbit-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes orbit-marquee { to { transform: translateX(-50%); } }
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        .orbit-rise { opacity: 0; animation: orbit-rise .9s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: var(--d, 0ms); }
        .orbit-marquee { animation: orbit-marquee 40s linear infinite; }
        .orbit-marquee:hover { animation-play-state: paused; }
        .orbit-beam { animation: orbit-spin 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .orbit-rise { opacity: 1; animation: none; }
          .orbit-marquee, .orbit-beam { animation: none; }
        }
      `}</style>

      {/* ------------------------------ En-tête ----------------------------- */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Accueil Orbit">
            <span className="grid size-9 place-items-center overflow-hidden rounded-lg border border-border bg-card">
              <Image src="/logo.png" alt="" width={28} height={28} priority />
            </span>
            <span className="text-lg font-semibold tracking-tight">Orbit</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/sign-in" />}>
              Se connecter
            </Button>
            <Button render={<Link href="/workspace" />}>
              Lancer
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* -------------------------------- Hero ------------------------------- */}
      <section className="relative">
        <GridBackdrop />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
          <div className="orbit-rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            <Badge variant="outline" className="h-8 gap-2 bg-card/60 px-3.5 backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              Agents IA récurrents
            </Badge>
          </div>

          <h1
            className="orbit-rise mx-auto mt-6 max-w-4xl text-balance bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text pb-2 text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            style={{ "--d": "100ms" } as React.CSSProperties}
          >
            Automatisez les tâches que vous répétez chaque jour.
          </h1>

          <p
            className="orbit-rise mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            Créez des agents IA qui retiennent vos instructions, s'exécutent selon un calendrier,
            utilisent vos outils connectés et vous font un compte rendu quand le travail est terminé.
          </p>

          <div
            className="orbit-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ "--d": "300ms" } as React.CSSProperties}
          >
            <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25" render={<Link href="/workspace" />}>
              Créer un agent récurrent
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 bg-card/50 px-6 text-base backdrop-blur" render={<a href="#platform" />}>
              <Play data-icon="inline-start" className="size-4" />
              Voir comment ça marche
            </Button>
          </div>

          <div
            className="orbit-rise mx-auto mt-16 max-w-5xl"
            style={{ "--d": "450ms" } as React.CSSProperties}
          >
            <AgentRunDemo />
          </div>
        </div>
      </section>

      {/* ------------------------------ Chiffres ----------------------------- */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-3 px-4 sm:px-6 lg:px-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn("py-8 text-center", i > 0 && "border-l border-border")}
            >
              <div className="text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Défilement --------------------------- */}
      <section className="py-14" aria-label="Outils connectés">
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Compatible avec les outils dont vos agents ont besoin
        </p>
        <div
          className="flex overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
          }}
        >
          <div className="orbit-marquee flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1}>
                {integrations.map(({ name, icon: Icon }) => (
                  <div
                    key={`${copy}-${name}`}
                    className="flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground"
                  >
                    <Icon className="size-4 text-primary" />
                    {name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ Plateforme --------------------------- */}
      <section id="platform" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          badge="Plateforme"
          icon={Cpu}
          title="Un centre de commande serein pour des agents efficaces"
          description="Chaque panneau répond à trois questions : ce que l'agent sait, ce qu'il fait et ce dont il a besoin de vous."
        />

        <div className="grid auto-rows-[minmax(220px,auto)] gap-4 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <SpotlightCard key={feature.title} className={feature.className}>
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-border bg-muted text-primary">
                      <Icon className="size-5" />
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground/50 transition group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                  <CardTitle className="text-xl tracking-tight">{feature.title}</CardTitle>
                  <CardDescription className="leading-6">{feature.description}</CardDescription>
                </CardHeader>

                {feature.visual === "plan" && (
                  <CardContent className="mt-auto pt-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {["Objectif", "Plan", "Outils", "Action", "Rapport"].map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <span className="rounded-md border border-border bg-muted/60 px-2.5 py-1 text-muted-foreground">
                            {s}
                          </span>
                          {i < arr.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                )}

                {feature.visual === "workspace" && (
                  <CardContent className="mt-auto pt-2">
                    <div className="space-y-2">
                      {["Chat", "État des tâches", "Fichiers", "Planifications", "Bureau en direct"].map((s) => (
                        <div
                          key={s}
                          className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                        >
                          {s}
                          <Check className="size-4 text-primary" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* ------------------------------- Agents ------------------------------ */}
      <section id="agents" className="scroll-mt-20 border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            badge="Agents"
            icon={Workflow}
            title="Du prompt à l'opération répétable"
            description="Orbit rend le comportement des agents lisible : planification claire, exécution des outils, points de relecture et trace durable de chaque exécution."
          />

          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden
              className="absolute left-[12%] right-[12%] top-[52px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            />
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                    <Icon className="size-6" />
                    <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-[16rem] text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------- Automatisations + Sécurité ------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <SpotlightCard>
            <div id="automations" className="scroll-mt-24" />
            <CardHeader>
              <Badge variant="outline" className="mb-3 w-fit gap-1.5">
                <DatabaseZap className="size-3.5 text-primary" />
                Automatisations
              </Badge>
              <CardTitle className="text-2xl tracking-tight sm:text-3xl">
                Planifiez vos routines sans perdre le fil
              </CardTitle>
              <CardDescription className="leading-6">
                Chaque routine garde sa fréquence, son historique et sa dernière action.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-2">
              {routines.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.cadence}</div>
                  </div>
                  <Badge variant={r.status === "En cours" ? "default" : "outline"} className="gap-1.5">
                    {r.status === "En cours" && (
                      <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
                    )}
                    {r.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </SpotlightCard>

          <SpotlightCard>
            <div id="security" className="scroll-mt-24" />
            <CardHeader>
              <Badge variant="outline" className="mb-3 w-fit gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Sécurité
              </Badge>
              <CardTitle className="text-2xl tracking-tight sm:text-3xl">Gardez le contrôle humain</CardTitle>
            </CardHeader>
            <CardContent className="mt-4 space-y-2">
              {securityItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </CardContent>
          </SpotlightCard>
        </div>
      </section>

      {/* -------------------------------- FAQ -------------------------------- */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading badge="FAQ" icon={Sparkles} title="Réponses rapides" />
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.question}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <GridBackdrop className="-z-0 opacity-70" />
          <div
            aria-hidden
            className="absolute left-1/2 top-0 h-56 w-[560px] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Donnez à votre prochain agent un endroit où travailler
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Ouvrez l'espace de travail, décrivez une routine et laissez Orbit gérer les répétitions.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25" render={<Link href="/workspace" />}>
                Ouvrir l'espace de travail
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- Pied de page --------------------------- */}
      <footer>
        <Separator />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center overflow-hidden rounded-md border border-border bg-card">
              <Image src="/logo.png" alt="" width={18} height={18} />
            </span>
            <span>© {new Date().getFullYear()} Orbit</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Pied de page">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
            <Link href="/sign-in" className="transition-colors hover:text-foreground">
              Se connecter
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}