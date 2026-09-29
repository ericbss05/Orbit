"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Command,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Données                                                                    */
/* -------------------------------------------------------------------------- */

const navItems = [
  { label: "Produit", href: "#product" },
  { label: "Comment ça marche", href: "#how-it-works" },
  { label: "Sécurité", href: "#security" },
];

const steps = [
  {
    number: "01",
    title: "Décrivez votre tâche",
    description:
      "Expliquez simplement ce que vous voulez automatiser. Pas besoin de construire un workflow.",
  },
  {
    number: "02",
    title: "L'agent prépare son travail",
    description:
      "Orbit comprend votre objectif, choisit les outils nécessaires et construit les étapes.",
  },
  {
    number: "03",
    title: "Laissez-le travailler",
    description:
      "L'agent exécute la tâche selon votre planning et vous informe lorsque le travail est terminé.",
  },
];

const features = [
  "Agents exécutables automatiquement",
  "Planification des tâches",
  "Outils connectés",
  "Historique des exécutions",
  "Validation humaine",
  "Mémoire des instructions",
];

/* -------------------------------------------------------------------------- */
/* Aperçu produit                                                             */
/* -------------------------------------------------------------------------- */

function ProductPreview() {
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRunning(true);

      setTimeout(() => {
        setRunning(false);
      }, 2800);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_80px_-30px_rgba(0,0,0,0.25)]">
        {/* Barre supérieure */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center overflow-hidden rounded-md border border-border">
              <Image
                src="/logo.png"
                alt=""
                width={18}
                height={18}
              />
            </div>

            <span className="text-sm font-medium">Orbit</span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
              Agent
            </div>

            <div className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
              Routine
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="grid min-h-[380px] lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <div className="hidden border-r border-border p-4 lg:block">
            <div className="text-xs font-medium text-muted-foreground">
              Workspace
            </div>

            <div className="mt-4 space-y-1">
              {["Agents", "Routines", "History", "Tools"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm",
                      index === 0
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-col">
            <div className="border-b border-border px-5 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Agent récurrent
                  </p>

                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    Suivi client
                  </h3>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 transition-colors",
                    running && "border-primary/40 text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full bg-muted-foreground",
                      running && "animate-pulse bg-primary",
                    )}
                  />

                  {running ? "En cours" : "Planifié"}
                </Badge>
              </div>
            </div>

            <div className="flex-1 p-5 sm:p-7">
              <div className="max-w-xl">
                <p className="text-sm text-muted-foreground">
                  Mission
                </p>

                <p className="mt-2 text-sm leading-6">
                  Vérifier les nouvelles demandes clients, résumer les
                  informations importantes et préparer le suivi du jour.
                </p>

                <div className="mt-7 space-y-2">
                  {[
                    "Vérifier les nouvelles demandes",
                    "Analyser les informations",
                    "Mettre à jour le suivi",
                    "Préparer le résumé",
                  ].map((item, index) => {
                    const completed = index === 0;
                    const active = running && index === 1;

                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-3"
                      >
                        <div
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border",
                            completed &&
                              "border-primary bg-primary text-primary-foreground",
                            active &&
                              "border-primary text-primary",
                          )}
                        >
                          {completed ? (
                            <Check className="size-3.5" />
                          ) : active ? (
                            <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <span className="text-sm">{item}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  Tous les jours à 09:00
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Orbit"
          >
            <span className="grid size-8 place-items-center overflow-hidden rounded-lg border border-border bg-card">
              <Image
                src="/logo.png"
                alt=""
                width={22}
                height={22}
                priority
              />
            </span>

            <span className="font-semibold tracking-tight">
              Orbit
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navigation principale"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href="/sign-in" />}
            >
              Se connecter
            </Button>

            <Button
              nativeButton={false}
              size="sm"
              render={<Link href="/workspace" />}
            >
              Commencer

              <ArrowRight
                data-icon="inline-end"
                className="size-4"
              />
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32">
          <Badge
            variant="outline"
            className="gap-1.5 bg-background px-3 py-1"
          >
            <Sparkles className="size-3.5 text-primary" />
            Agents IA
          </Badge>

          <h1 className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Faites travailler vos agents.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-muted-foreground">
            Créez des agents IA capables d'exécuter vos tâches,
            d'utiliser vos outils et de travailler automatiquement,
            même lorsque vous n'êtes pas là.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              size="lg"
              className="h-11 px-5"
              render={<Link href="/workspace" />}
            >
              Créer mon premier agent

              <ArrowRight
                data-icon="inline-end"
                className="size-4"
              />
            </Button>

            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 px-5"
              render={<a href="#how-it-works" />}
            >
              Comment ça marche

              <ChevronRight
                data-icon="inline-end"
                className="size-4"
              />
            </Button>
          </div>
        </div>

        {/* Aperçu de l'application */}
        <div className="px-4 pb-24 sm:px-6">
          <ProductPreview />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Product statement                                                  */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="product"
        className="scroll-mt-20 border-y border-border"
      >
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-medium text-primary">
            Un agent. Une mission. Une routine.
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Remplacez les tâches répétitives par des agents qui savent quoi faire.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Orbit vous permet de transformer une tâche que vous répétez
            chaque semaine en une routine exécutée automatiquement.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="how-it-works"
        className="scroll-mt-20"
      >
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">
              Comment ça marche
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Aussi simple que de donner une tâche.
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-background p-7 sm:p-8"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {step.number}
                </span>

                <h3 className="mt-8 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-medium text-primary">
                Ce que vous obtenez
              </p>

              <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
                Toute la puissance d'un agent, sans la complexité.
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
                Orbit s'occupe de la logique d'exécution. Vous vous
                concentrez sur le résultat attendu.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3.5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>

                  <span className="text-sm font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Security                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="security"
        className="scroll-mt-20"
      >
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto grid size-12 place-items-center rounded-xl border border-border bg-muted">
            <ShieldCheck className="size-5" />
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Vous gardez le contrôle.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
            Les actions sensibles peuvent nécessiter votre validation.
            Chaque exécution est enregistrée pour que vous sachiez
            exactement ce que votre agent a fait.
          </p>

          <div className="mx-auto mt-10 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            {[
              "Validation humaine",
              "Historique des actions",
              "Outils contrôlés",
              "Déconnexion à tout moment",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm"
              >
                <Check className="size-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-muted/30 px-6 py-16 text-center sm:px-12">
          <Command className="mx-auto size-6 text-primary" />

          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Votre prochaine tâche peut être la dernière que vous faites manuellement.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Créez un agent, donnez-lui une mission et laissez Orbit
            s'occuper du reste.
          </p>

          <div className="mt-8">
            <Button
              nativeButton={false}
              size="lg"
              className="h-11 px-6"
              render={<Link href="/workspace" />}
            >
              Commencer avec Orbit

              <ArrowRight
                data-icon="inline-end"
                className="size-4"
              />
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                             */}
      {/* ------------------------------------------------------------------ */}

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
            />

            <span>
              © {new Date().getFullYear()} Orbit
            </span>
          </div>

          <nav
            className="flex items-center gap-5"
            aria-label="Pied de page"
          >
            <a
              href="#product"
              className="transition-colors hover:text-foreground"
            >
              Produit
            </a>

            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              Comment ça marche
            </a>

            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}