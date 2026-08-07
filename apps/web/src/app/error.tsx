"use client";

import { Button } from "@eventifyy/ui/components/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-0 place-items-center overflow-auto bg-slate-50 px-4 py-12 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-950 dark:bg-slate-900">
        <p className="text-sm font-black uppercase text-red-700 dark:text-red-300">Erreur de chargement</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal">Eventifyy n'a pas pu charger cette page.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          L'API ou la base de données est peut-être temporairement indisponible. Tu peux réessayer sans quitter
          l'application.
        </p>
        <Button className="mt-5" onClick={reset}>
          Réessayer
        </Button>
      </section>
    </main>
  );
}
