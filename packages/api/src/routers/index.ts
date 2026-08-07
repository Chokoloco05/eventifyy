import prisma from "@eventifyy/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { EVENT_CATEGORIES, eventSelect, getCommunityAccess, listPublicEvents, withEventMeta } from "../events";
import { protectedProcedure, publicProcedure, router } from "../index";

const categorySchema = z.enum(["MUSIC", "FOOD", "TECH", "SPORT", "ART", "NIGHTLIFE", "COMMUNITY"]);

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  eventCategories: publicProcedure.query(() => {
    return EVENT_CATEGORIES;
  }),

  communityAccess: protectedProcedure.query(async ({ ctx }) => {
    return getCommunityAccess(ctx.session.user.id);
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
      return listPublicEvents(input, ctx.session?.user.id);
    }),

  eventById: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const event = await prisma.event.findUnique({
      where: { id: input.id },
      select: eventSelect,
    });

    if (!event) {
      return null;
    }

    const registrations = ctx.session?.user.id
      ? await prisma.registration.findMany({
          where: { userId: ctx.session.user.id, eventId: input.id },
          select: { eventId: true },
        })
      : [];
    const registeredEventIds = new Set(registrations.map((registration) => registration.eventId));
    const access = ctx.session?.user.id
      ? await getCommunityAccess(ctx.session.user.id)
      : { organizedCount: 0, hasCommunityAccess: false };

    return withEventMeta(event, ctx.session?.user.id, registeredEventIds, access.hasCommunityAccess);
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
      try {
        return await prisma.$transaction(async (tx) => {
          const event = await tx.event.findUnique({
            where: { id: input.eventId },
            select: {
              id: true,
              organizerId: true,
              capacity: true,
              startsAt: true,
              _count: { select: { registrations: true } },
            },
          });

          if (!event) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
          }

          if (event.startsAt.getTime() < Date.now()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cet événement est déjà terminé" });
          }

          if (event.organizerId === ctx.session.user.id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Tu ne peux pas réserver ton propre événement" });
          }

          const contributionCount = await tx.event.count({
            where: {
              organizerId: ctx.session.user.id,
              status: "PUBLISHED",
            },
          });

          if (contributionCount === 0) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Publie d'abord un événement pour rejoindre les sorties de la communauté.",
            });
          }

          if (event._count.registrations >= event.capacity) {
            throw new TRPCError({ code: "CONFLICT", message: "Cet événement est complet" });
          }

          return tx.registration.upsert({
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
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: "L'inscription n'a pas pu être confirmée. Réessaie dans quelques secondes.",
        });
      }
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

    const access = organized.some((event) => event.status === "PUBLISHED");

    return {
      organized: organized.map((event) => withEventMeta(event, ctx.session.user.id, new Set(), true)),
      registrations: registrations.map((registration) => ({
        ...registration,
        event: withEventMeta(registration.event, ctx.session.user.id, new Set([registration.event.id]), access),
      })),
      communityAccess: {
        organizedCount: organized.filter((event) => event.status === "PUBLISHED").length,
        hasCommunityAccess: access,
      },
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
