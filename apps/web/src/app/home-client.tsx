"use client";

import { Button } from "@eventifyy/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@eventifyy/ui/components/card";
import { Input } from "@eventifyy/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { AppRouter } from "@eventifyy/api/routers/index";

import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: "Musique",
  FOOD: "Food",
  TECH: "Tech",
  SPORT: "Sport",
  ART: "Art",
  NIGHTLIFE: "Nightlife",
  COMMUNITY: "Communauté",
};

const CATEGORY_STYLES: Record<string, string> = {
  MUSIC: "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200",
  FOOD: "bg-orange-100 text-orange-800 ring-orange-200",
  TECH: "bg-sky-100 text-sky-800 ring-sky-200",
  SPORT: "bg-lime-100 text-lime-800 ring-lime-200",
  ART: "bg-violet-100 text-violet-800 ring-violet-200",
  NIGHTLIFE: "bg-rose-100 text-rose-800 ring-rose-200",
  COMMUNITY: "bg-teal-100 text-teal-800 ring-teal-200",
};

type RouterEvent = inferRouterOutputs<AppRouter>["events"][number];
type HomeEvent = RouterEvent;
type Category = inferRouterOutputs<AppRouter>["eventCategories"][number];

type HomeClientProps = {
  initialCategories: readonly Category[];
  initialEvents: HomeEvent[];
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(priceCents: number) {
  if (priceCents === 0) {
    return "Gratuit";
  }

  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function updateRegistration(events: HomeEvent[] | undefined, eventId: string, isRegistered: boolean) {
  return events?.map((event) => {
    if (event.id !== eventId) {
      return event;
    }

    const attendeeCount = Math.max(0, event.attendeeCount + (isRegistered ? 1 : -1));

    return {
      ...event,
      attendeeCount,
      isFull: attendeeCount >= event.capacity,
      isRegistered,
      canRegister: !isRegistered && attendeeCount < event.capacity && new Date(event.startsAt).getTime() >= Date.now(),
    };
  });
}

export default function HomeClient({ initialCategories, initialEvents }: HomeClientProps) {
  const session = authClient.useSession();
  const [category, setCategory] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ({
      category: category === "ALL" ? undefined : (category as never),
      query: query.trim() || undefined,
      onlyUpcoming: true,
    }),
    [category, query],
  );

  const eventQueryOptions = trpc.events.queryOptions(filters);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const categories = useQuery(trpc.eventCategories.queryOptions());
  const events = useQuery(eventQueryOptions);

  const registerMutation = useMutation(
    trpc.registerForEvent.mutationOptions({
      onMutate: async ({ eventId }) => {
        await queryClient.cancelQueries({ queryKey: eventQueryOptions.queryKey });
        const previousEvents = queryClient.getQueryData<HomeEvent[]>(eventQueryOptions.queryKey);
        queryClient.setQueryData<HomeEvent[]>(eventQueryOptions.queryKey, (current) =>
          updateRegistration(current, eventId, true),
        );
        return { previousEvents };
      },
      onSuccess: () => {
        toast.success("Réservation confirmée");
      },
      onError: (error, _variables, context) => {
        queryClient.setQueryData(eventQueryOptions.queryKey, context?.previousEvents);
        toast.error(error.message);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: eventQueryOptions.queryKey });
      },
    }),
  );

  const unregisterMutation = useMutation(
    trpc.unregisterFromEvent.mutationOptions({
      onMutate: async ({ eventId }) => {
        await queryClient.cancelQueries({ queryKey: eventQueryOptions.queryKey });
        const previousEvents = queryClient.getQueryData<HomeEvent[]>(eventQueryOptions.queryKey);
        queryClient.setQueryData<HomeEvent[]>(eventQueryOptions.queryKey, (current) =>
          updateRegistration(current, eventId, false),
        );
        return { previousEvents };
      },
      onSuccess: () => {
        toast.error("Réservation annulée");
      },
      onError: (error, _variables, context) => {
        queryClient.setQueryData(eventQueryOptions.queryKey, context?.previousEvents);
        toast.error(error.message);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: eventQueryOptions.queryKey });
      },
    }),
  );

  const showInitialEvents = category === "ALL" && query.trim().length === 0 && !events.data;
  const eventList = (showInitialEvents ? initialEvents : events.data ?? []) as HomeEvent[];
  const featuredEvent = eventList[0];
  const totalSpots = eventList.reduce((sum, event) => sum + Math.max(0, event.capacity - event.attendeeCount), 0);
  const nextNeighborhoods = Array.from(new Set(eventList.map((event) => event.neighborhood))).slice(0, 4);
  const isLoadingFilteredEvents = events.isLoading && !showInitialEvents;

  return (
    <main className="min-h-0 overflow-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black uppercase text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900">
                Eventifyy Bruxelles
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                API {healthCheck.data ? "connectée" : "en vérification"}
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-normal text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              Découvre, réserve et organise tes sorties à Bruxelles.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              Eventifyy centralise les événements, les réservations et l'organisation dans une expérience simple :
              un feed clair, des filtres utiles, et un dashboard pour publier rapidement.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-950"
                href="#events"
              >
                Explorer les events
              </a>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                href={session.data?.user ? "/dashboard" : "/login"}
              >
                {session.data?.user ? "Créer un événement" : "Se connecter"}
              </Link>
            </div>
          </div>

          <Card className="animate-in fade-in slide-in-from-bottom-4 border-slate-200 shadow-sm duration-700 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Activité en direct</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-3xl font-black">{eventList.length}</p>
                <p className="text-sm font-semibold text-slate-500">événements disponibles</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-3xl font-black">{totalSpots}</p>
                <p className="text-sm font-semibold text-slate-500">places restantes</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  {nextNeighborhoods.length > 0 ? nextNeighborhoods.join(" · ") : "Bruxelles"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">quartiers actifs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase text-slate-500">Recherche</h2>
              <Input
                className="mt-3"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Lieu, quartier, event..."
                value={query}
              />
            </div>

            <div>
              <h2 className="text-sm font-black uppercase text-slate-500">Catégories</h2>
              <div className="mt-3 grid gap-2">
                <Button
                  className="justify-start"
                  onClick={() => setCategory("ALL")}
                  size="sm"
                  variant={category === "ALL" ? "default" : "outline"}
                >
                  Tous les events
                </Button>
                {(categories.data ?? initialCategories).map((item) => (
                  <Button
                    className="justify-start"
                    key={item.value}
                    onClick={() => setCategory(item.value)}
                    size="sm"
                    variant={category === item.value ? "default" : "outline"}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5" id="events">
          {events.isError ? (
            <Card className="border-red-200 bg-red-50 text-red-950">
              <CardContent className="p-5 text-sm font-semibold">
                Impossible de charger les événements. Vérifie la connexion API puis réessaie.
              </CardContent>
            </Card>
          ) : null}

          {featuredEvent ? (
            <Card className="overflow-hidden border-slate-200 bg-slate-950 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800">
              <CardContent className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
                <div>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-black uppercase text-teal-200 ring-1 ring-white/15">
                    Prochain event recommandé
                  </span>
                  <h2 className="mt-4 text-2xl font-black tracking-normal sm:text-3xl">{featuredEvent.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{featuredEvent.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-200">
                    <span>{formatDate(featuredEvent.startsAt)}</span>
                    <span>·</span>
                    <span>{featuredEvent.venueName}</span>
                    <span>·</span>
                    <span>{formatPrice(featuredEvent.priceCents)}</span>
                  </div>
                </div>
                <div className="grid content-end gap-2 sm:w-44">
                  <p className="text-sm font-bold text-slate-300">
                    {featuredEvent.attendeeCount}/{featuredEvent.capacity} participants
                  </p>
                  <EventAction
                    event={featuredEvent}
                    isLoggedIn={Boolean(session.data?.user)}
                    isPending={registerMutation.isPending || unregisterMutation.isPending}
                    onRegister={(eventId) => registerMutation.mutate({ eventId })}
                    onUnregister={(eventId) => unregisterMutation.mutate({ eventId })}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-normal">Événements à venir</h2>
              <p className="mt-1 text-sm text-slate-500">{eventList.length} résultat(s) selon tes filtres</p>
            </div>
            <Link className="hidden text-sm font-black text-teal-700 hover:text-teal-900 sm:block" href="/dashboard">
              Publier un event
            </Link>
          </div>

          {isLoadingFilteredEvents ? <EventSkeleton /> : null}

          {!isLoadingFilteredEvents && eventList.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="font-semibold">Aucun événement pour ces filtres.</p>
                <Link className="text-sm font-black text-teal-700" href="/dashboard">
                  Créer le premier événement
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {eventList.map((event) => (
              <EventCard
                event={event}
                isLoggedIn={Boolean(session.data?.user)}
                isPending={registerMutation.isPending || unregisterMutation.isPending}
                key={event.id}
                onRegister={(eventId) => registerMutation.mutate({ eventId })}
                onUnregister={(eventId) => unregisterMutation.mutate({ eventId })}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

type EventActionProps = {
  event: HomeEvent;
  isLoggedIn: boolean;
  isPending: boolean;
  onRegister: (eventId: string) => void;
  onUnregister: (eventId: string) => void;
};

function EventAction({ event, isLoggedIn, isPending, onRegister, onUnregister }: EventActionProps) {
  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:bg-white dark:text-slate-950"
          href="/login"
        >
          Se connecter pour participer
        </Link>
        <Link className="block text-center text-xs font-bold text-teal-700 hover:text-teal-900" href={"/community" as Route}>
          Comprendre la règle d'accès
        </Link>
      </div>
    );
  }

  if (!event.isRegistered && !event.canRegister && event.lockedReason) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
        <p className="text-xs font-bold leading-5">{event.lockedReason}</p>
        <Link className="inline-flex h-9 w-full items-center justify-center rounded-md bg-amber-900 px-3 text-xs font-black text-white" href="/dashboard">
          Débloquer mon accès
        </Link>
      </div>
    );
  }

  return (
    <Button
      className="w-full transition-all duration-200 hover:-translate-y-0.5"
      disabled={isPending || event.isFull || (!event.isRegistered && !event.canRegister)}
      onClick={() => (event.isRegistered ? onUnregister(event.id) : onRegister(event.id))}
      variant={event.isRegistered ? "outline" : "default"}
    >
      {event.isRegistered ? "Annuler ma réservation" : event.isFull ? "Complet" : "Participer"}
    </Button>
  );
}

function EventCard(props: EventActionProps) {
  const { event } = props;

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {event.coverImage ? (
        <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage})` }} />
      ) : (
        <div className="h-2 bg-gradient-to-r from-teal-500 via-slate-950 to-orange-500" />
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
              CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.COMMUNITY
            }`}
          >
            {CATEGORY_LABELS[event.category]}
          </span>
          <span className="text-sm font-black text-slate-500">{formatPrice(event.priceCents)}</span>
        </div>
        <CardTitle className="text-xl tracking-normal transition-colors group-hover:text-teal-700">
          {event.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{event.description}</p>
        <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>{formatDate(event.startsAt)}</span>
          <span>
            {event.venueName} · {event.neighborhood}
          </span>
          <span>
            {event.attendeeCount}/{event.capacity} participants
          </span>
        </div>
        <EventAction {...props} />
      </CardContent>
    </Card>
  );
}

function EventSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((item) => (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" key={item}>
          <div className="h-2 bg-slate-200 dark:bg-slate-800" />
          <CardContent className="space-y-4 p-5">
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
