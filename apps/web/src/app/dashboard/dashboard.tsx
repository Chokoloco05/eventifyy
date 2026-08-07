"use client";

import { Button } from "@eventifyy/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@eventifyy/ui/components/card";
import { Input } from "@eventifyy/ui/components/input";
import { Label } from "@eventifyy/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

const BRUSSELS_POINTS = [
  { label: "Bruxelles Centre", neighborhood: "Centre", address: "Grand-Place, 1000 Bruxelles", lat: 50.8467, lng: 4.3525 },
  { label: "Ixelles", neighborhood: "Ixelles", address: "Place Flagey, 1050 Ixelles", lat: 50.8276, lng: 4.3728 },
  { label: "Saint-Gilles", neighborhood: "Saint-Gilles", address: "Parvis de Saint-Gilles, 1060 Bruxelles", lat: 50.8301, lng: 4.3456 },
  { label: "Schaerbeek", neighborhood: "Schaerbeek", address: "Place Colignon, 1030 Schaerbeek", lat: 50.8676, lng: 4.3732 },
  { label: "Uccle", neighborhood: "Uccle", address: "Parvis Saint-Pierre, 1180 Uccle", lat: 50.8032, lng: 4.3373 },
];

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(priceCents: number) {
  return priceCents === 0
    ? "Gratuit"
    : new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  const categories = useQuery(trpc.eventCategories.queryOptions());
  const privateData = useQuery(trpc.privateData.queryOptions());
  const myEvents = useQuery(trpc.myEvents.queryOptions());

  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(19, 0, 0, 0);
    return toLocalDateTimeInput(date);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("MUSIC");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [venueName, setVenueName] = useState("");
  const [capacity, setCapacity] = useState("80");
  const [price, setPrice] = useState("0");
  const [coverImage, setCoverImage] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(BRUSSELS_POINTS[0]);

  const createEvent = useMutation(
    trpc.createEvent.mutationOptions({
      onSuccess: async () => {
        toast.success("Événement créé");
        setTitle("");
        setDescription("");
        setVenueName("");
        setCoverImage("");
        await myEvents.refetch();
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createEvent.mutate({
      title,
      description,
      category: category as never,
      startsAt: new Date(startsAt).toISOString(),
      venueName,
      address: selectedPoint.address,
      neighborhood: selectedPoint.neighborhood,
      latitude: selectedPoint.lat,
      longitude: selectedPoint.lng,
      capacity: Number(capacity),
      priceCents: Math.round(Number(price) * 100),
      coverImage,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="space-y-6">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="tracking-normal">Créer un événement</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCreateEvent}>
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" minLength={3} onChange={(event) => setTitle(event.target.value)} required value={title} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  className="min-h-28 rounded-md border bg-background p-3 text-sm outline-none transition-colors focus:border-slate-400"
                  id="description"
                  minLength={12}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  value={description}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <select
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    id="category"
                    onChange={(event) => setCategory(event.target.value)}
                    value={category}
                  >
                    {(categories.data ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Date</Label>
                  <Input
                    id="startsAt"
                    onChange={(event) => setStartsAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={startsAt}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="venueName">Lieu</Label>
                  <Input id="venueName" minLength={2} onChange={(event) => setVenueName(event.target.value)} required value={venueName} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="point">Quartier</Label>
                  <select
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    id="point"
                    onChange={(event) => {
                      setSelectedPoint(BRUSSELS_POINTS[Number(event.target.value)] ?? BRUSSELS_POINTS[0]);
                    }}
                  >
                    {BRUSSELS_POINTS.map((point, index) => (
                      <option key={point.label} value={index}>
                        {point.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacité</Label>
                  <Input id="capacity" min={1} onChange={(event) => setCapacity(event.target.value)} required type="number" value={capacity} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix EUR</Label>
                  <Input id="price" min={0} onChange={(event) => setPrice(event.target.value)} step="0.5" type="number" value={price} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coverImage">Image URL</Label>
                  <Input id="coverImage" onChange={(event) => setCoverImage(event.target.value)} placeholder="Optionnel" value={coverImage} />
                </div>
              </div>
              <Button className="transition-all duration-200 hover:-translate-y-0.5" disabled={createEvent.isPending} type="submit">
                {createEvent.isPending ? "Création..." : "Publier l'événement"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="tracking-normal">Mes événements organisés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myEvents.data?.organized.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tu n'as pas encore créé d'événement.</p>
            ) : null}
            {myEvents.data?.organized.map((event) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900" key={event.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{event.title}</p>
                  <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[event.category]}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                <p className="mt-1 text-sm">
                  {event.attendeeCount}/{event.capacity} inscrits - {event.neighborhood}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="tracking-normal">Accès communauté</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {myEvents.data?.communityAccess.hasCommunityAccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <p className="font-black">Accès débloqué</p>
                <p className="mt-1 leading-6">
                  Tu as publié {myEvents.data.communityAccess.organizedCount} événement(s). Tu peux réserver les sorties
                  de la communauté.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="font-black">Accès verrouillé</p>
                <p className="mt-1 leading-6">
                  Publie ton premier événement pour pouvoir participer aux sorties proposées par les autres membres.
                </p>
              </div>
            )}
            <Link className="font-black text-teal-700 hover:text-teal-900" href={"/community" as Route}>
              Voir les règles de la communauté
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="tracking-normal">Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{session.user.name}</p>
            <p className="text-muted-foreground">{session.user.email}</p>
            <p className="text-muted-foreground">
              API privee : {privateData.isLoading ? "chargement..." : privateData.data?.message}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="tracking-normal">Mes réservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myEvents.data?.registrations.length === 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Aucune réservation pour l'instant.</p>
                <Link className="font-bold text-teal-700" href="/">
                  Explorer les events
                </Link>
              </div>
            ) : null}
            {myEvents.data?.registrations.map(({ event, id }) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900" key={id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                <p className="mt-1 text-sm">
                  {event.venueName} - {formatPrice(event.priceCents)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
