import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "La communauté",
  description:
    "Eventifyy est une communauté sélective où chaque membre doit contribuer avant de rejoindre les événements des autres.",
};

const principles = [
  {
    title: "Contribuer avant de participer",
    text: "Pour réserver une place, chaque membre doit d'abord publier au moins un événement. Eventifyy récompense l'effort, pas la simple consommation.",
  },
  {
    title: "Des sorties portées par la communauté",
    text: "Les événements ne viennent pas d'un catalogue impersonnel. Ils viennent des membres qui proposent une idée, un lieu, une ambiance et une intention.",
  },
  {
    title: "Un cercle volontairement restreint",
    text: "L'accès est ouvert, mais pas passif. La règle de contribution crée une communauté plus impliquée, plus fiable et plus attentive aux autres.",
  },
] as const;

export default function CommunityPage() {
  return (
    <main className="min-h-0 overflow-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-black uppercase text-teal-700 dark:text-teal-300">Communauté Eventifyy</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal sm:text-5xl">
            Un cercle sélectif pour les personnes qui créent autant qu'elles participent.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Eventifyy repose sur une règle simple : tu peux découvrir les sorties, mais tu dois d'abord proposer
            au moins un événement pour réserver chez les autres. L'objectif est de construire une communauté active,
            responsable et réellement investie dans la vie locale bruxelloise.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-950"
              href="/dashboard"
            >
              Proposer un événement
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              href="/"
            >
              Explorer les sorties
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-3">
        {principles.map((principle, index) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            key={principle.title}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-sm font-black text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900">
              {index + 1}
            </span>
            <h2 className="mt-5 text-xl font-black tracking-normal">{principle.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{principle.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm dark:border-slate-800">
          <p className="text-sm font-black uppercase text-teal-200">Règle d'accès</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal">Aucun spectateur permanent.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Eventifyy n'est pas pensé comme une billetterie classique. Pour rejoindre le cercle, chaque membre doit
            d'abord prendre l'initiative d'organiser une sortie. Cette contrainte rend la communauté plus sélective,
            plus équilibrée et plus humaine.
          </p>
        </div>
      </section>
    </main>
  );
}
