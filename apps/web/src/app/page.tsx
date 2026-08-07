import type { Metadata } from "next";

import { EVENT_CATEGORIES, listPublicEvents } from "@eventifyy/api/events";

import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eventifyy Bruxelles | Découvrir et organiser des événements",
  description:
    "Explore les événements à Bruxelles, réserve ta place et publie tes propres sorties depuis Eventifyy.",
  openGraph: {
    title: "Eventifyy Bruxelles",
    description: "Découvre, réserve et organise tes sorties à Bruxelles.",
    type: "website",
  },
};

export default async function HomePage() {
  const events = await Promise.race([
    listPublicEvents({ onlyUpcoming: true }),
    new Promise<[]>(resolve => {
      setTimeout(() => resolve([]), 1500);
    }),
  ]).catch((error) => {
    console.error("Failed to load public events for first render", error);
    return [];
  });

  return (
    <HomeClient
      initialCategories={[...EVENT_CATEGORIES]}
      initialEvents={JSON.parse(JSON.stringify(events))}
    />
  );
}
