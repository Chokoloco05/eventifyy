import prisma from "@eventifyy/db";

export const EVENT_CATEGORIES = [
  { value: "MUSIC", label: "Musique" },
  { value: "FOOD", label: "Food" },
  { value: "TECH", label: "Tech" },
  { value: "SPORT", label: "Sport" },
  { value: "ART", label: "Art" },
  { value: "NIGHTLIFE", label: "Nightlife" },
  { value: "COMMUNITY", label: "Communauté" },
] as const;

export const eventSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
  startsAt: true,
  endsAt: true,
  venueName: true,
  address: true,
  neighborhood: true,
  latitude: true,
  longitude: true,
  capacity: true,
  priceCents: true,
  coverImage: true,
  organizerId: true,
  createdAt: true,
  organizer: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  _count: {
    select: {
      registrations: true,
    },
  },
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"];

type EventWithCount = {
  id?: string;
  organizerId?: string;
  capacity: number;
  startsAt: Date;
  _count: { registrations: number };
};

export function withEventMeta<T extends EventWithCount>(
  event: T,
  userId?: string,
  registeredEventIds: Set<string> = new Set(),
  hasCommunityAccess = false,
) {
  const eventId = typeof event.id === "string" ? event.id : undefined;
  const isOwnEvent = Boolean(userId && event.organizerId === userId);
  const isRegistered = eventId ? registeredEventIds.has(eventId) : false;
  const isFull = event._count.registrations >= event.capacity;
  const isPast = event.startsAt.getTime() < Date.now();
  const lockedReason = !userId
    ? "Connecte-toi pour demander une place."
    : !hasCommunityAccess
      ? "Publie d'abord un événement pour débloquer les réservations."
      : isOwnEvent
        ? "Tu ne peux pas réserver ton propre événement."
        : undefined;

  return {
    ...event,
    attendeeCount: event._count.registrations,
    isFull,
    isPast,
    isOwnEvent,
    isRegistered,
    hasCommunityAccess,
    lockedReason,
    canRegister:
      Boolean(userId) &&
      Boolean(eventId) &&
      hasCommunityAccess &&
      !isOwnEvent &&
      !isRegistered &&
      !isFull &&
      !isPast,
  };
}

export type EventFilters = {
  category?: EventCategory;
  query?: string;
  onlyUpcoming?: boolean;
};

export async function getCommunityAccess(userId: string) {
  const organizedCount = await prisma.event.count({
    where: {
      organizerId: userId,
      status: "PUBLISHED",
    },
  });

  return {
    organizedCount,
    hasCommunityAccess: organizedCount > 0,
  };
}

export async function listPublicEvents(input?: EventFilters, userId?: string) {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: input?.onlyUpcoming === false ? undefined : { gte: new Date() },
      category: input?.category,
      OR: input?.query
        ? [
            { title: { contains: input.query, mode: "insensitive" } },
            { venueName: { contains: input.query, mode: "insensitive" } },
            { neighborhood: { contains: input.query, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ startsAt: "asc" }],
    select: eventSelect,
  });

  const [registrations, access] = userId
    ? await Promise.all([
        prisma.registration.findMany({
          where: { userId, eventId: { in: events.map((event) => event.id) } },
          select: { eventId: true },
        }),
        getCommunityAccess(userId),
      ])
    : [[], { organizedCount: 0, hasCommunityAccess: false }] as const;

  const registeredEventIds = new Set(registrations.map((registration) => registration.eventId));

  return events.map((event) => withEventMeta(event, userId, registeredEventIds, access.hasCommunityAccess));
}
