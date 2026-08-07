export default function Loading() {
  return (
    <main className="min-h-0 overflow-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12">
          <div className="space-y-5">
            <div className="h-7 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-14 max-w-3xl animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 max-w-2xl animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    </main>
  );
}
