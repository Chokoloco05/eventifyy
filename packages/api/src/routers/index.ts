import prisma from "@eventifyy/db";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

const categorySchema = z.enum([
  "MUSIC",
  "FOOD",
  "TECH",
  "SPORT",
  "ART",
  "NIGHTLIFE",
  "COMMUNITY",
]);

const eventSelect = {
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

function withEventMeta<T extends { capacity: number; startsAt: Date; _count: { registrations: number } }>(
  event: T,
  userId?: string,
  registeredEventIds: Set<string> = new Set(),
) {
  return {
    ...event,
    attendeeCount: event._count.registrations,
    isFull: event._count.registrations >= event.capacity,
    isPast: event.startsAt.getTime() < Date.now(),
    isRegistered: "id" in event && typeof event.id === "string" ? registeredEventIds.has(event.id) : false,
    canRegister:
      Boolean(userId) &&
      "id" in event &&
      typeof event.id === "string" &&
      !registeredEventIds.has(event.id) &&
      event._count.registrations < event.capacity &&
      event.startsAt.getTime() >= Date.now(),
  };
}

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  eventCategories: publicProcedure.query(() => {
    return [
      { value: "MUSIC", label: "Musique" },
      { value: "FOOD", label: "Food" },
      { value: "TECH", label: "Tech" },
      { value: "SPORT", label: "Sport" },
      { value: "ART", label: "Art" },
      { value: "NIGHTLIFE", label: "Nightlife" },
      { value: "COMMUNITY", label: "Communauté" },
    ] as const;
  }),
  events: publicProcedure
    .input(
      z
        .object({
          category: categorySchema.optional(),
          query: z.string().trim().optional(),
          onlyUpcoming: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
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

      const registeredEventIds = userId
        ? new Set(
            (
              await prisma.registration.findMany({
                where: { userId, eventId: { in: events.map((event) => event.id) } },
                select: { eventId: true },
              })
            ).map((registration) => registration.eventId),
          )
        : new Set<string>();

      return events.map((event) => withEventMeta(event, userId, registeredEventIds));
    }),
  eventById: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user.id;
    const event = await prisma.event.findUnique({
      where: { id: input.id },
      select: eventSelect,
    });

    if (!event) {
      return null;
    }

    const registeredEventIds = userId
      ? new Set(
          (
            await prisma.registration.findMany({
              where: { userId, eventId: input.id },
              select: { eventId: true },
            })
          ).map((registration) => registration.eventId),
        )
      : new Set<string>();

    return withEventMeta(event, userId, registeredEventIds);
  }),
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(3).max(80),
        description: z.string().trim().min(12).max(1200),
        category: categorySchema,
        startsAt: z.iso.datetime(),
        endsAt: z.iso.datetime().optional().or(z.literal("")),
        venueName: z.string().trim().min(2).max(80),
        address: z.string().trim().min(5).max(160),
        neighborhood: z.string().trim().min(2).max(60),
        latitude: z.number().min(50.7).max(51.0),
        longitude: z.number().min(4.1).max(4.7),
        capacity: z.number().int().min(1).max(20000),
        priceCents: z.number().int().min(0).max(1000000).default(0),
        coverImage: z.url().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.event.create({
        data: {
          ...input,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          startsAt: new Date(input.startsAt),
          coverImage: input.coverImage || null,
          organizerId: ctx.session.user.id,
        },
        select: eventSelect,
      });
    }),
  registerForEvent: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
        select: {
          id: true,
          capacity: true,
          startsAt: true,
          _count: { select: { registrations: true } },
        },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.startsAt.getTime() < Date.now()) {
        throw new Error("Event is already finished");
      }

      if (event._count.registrations >= event.capacity) {
        throw new Error("Event is full");
      }

      return prisma.registration.upsert({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: ctx.session.user.id,
          },
        },
        create: {
          eventId: input.eventId,
          userId: ctx.session.user.id,
        },
        update: {},
      });
    }),
  unregisterFromEvent: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.registration.deleteMany({
        where: {
          eventId: input.eventId,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),
  myEvents: protectedProcedure.query(async ({ ctx }) => {
    const [organized, registrations] = await Promise.all([
      prisma.event.findMany({
        where: { organizerId: ctx.session.user.id },
        orderBy: [{ startsAt: "asc" }],
        select: eventSelect,
      }),
      prisma.registration.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          event: {
            select: eventSelect,
          },
        },
      }),
    ]);

    return {
      organized: organized.map((event) => withEventMeta(event, ctx.session.user.id)),
      registrations: registrations.map((registration) => ({
        ...registration,
        event: withEventMeta(registration.event, ctx.session.user.id, new Set([registration.event.id])),
      })),
    };
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
