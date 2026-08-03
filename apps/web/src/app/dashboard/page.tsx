import { auth } from "@eventifyy/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-0 overflow-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="text-sm font-black uppercase text-teal-700 dark:text-teal-300">Dashboard organisateur</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-normal sm:text-4xl">
                Pilote tes événements Eventifyy.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Crée des sorties à Bruxelles, suis les inscriptions, et garde tes réservations au même endroit.
              </p>
            </div>
            <div className="grid content-center rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-sm font-bold text-slate-500">Connecté en tant que</p>
              <p className="mt-1 truncate text-lg font-black">{session.user.name}</p>
              <p className="truncate text-sm text-slate-500">{session.user.email}</p>
            </div>
          </div>
        </section>
        <Dashboard session={session} />
      </div>
    </main>
  );
}
