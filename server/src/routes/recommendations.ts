import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";
import { requireAuth } from "../auth.js";

export const recommendationsRouter = Router();

const createSchema = z.object({
  // Either reference an existing provider...
  providerId: z.string().optional(),
  // ...or create one inline by name.
  providerName: z.string().optional(),
  providerPhone: z.string().optional(),
  providerWebsite: z.string().optional(),

  categorySlug: z.string(),
  rating: z.number().int().min(1).max(5),
  recommend: z.boolean().default(true),
  timesUsed: z.string().optional(),
  pricePaid: z.string().optional(),
  comment: z.string().optional(),
  groupInterest: z.boolean().default(false),
  groupTargetDate: z.string().optional(),
});

recommendationsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const me = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!me?.neighborhoodId) {
      return res
        .status(400)
        .json({ error: "Set your neighborhood before adding a recommendation" });
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) return res.status(400).json({ error: "Unknown service category" });

    // Resolve or create the provider.
    let providerId = data.providerId;
    if (!providerId) {
      if (!data.providerName) {
        return res.status(400).json({ error: "providerId or providerName is required" });
      }
      // Reuse a provider with a matching (case-insensitive) name if present.
      const all = await prisma.provider.findMany();
      const match = all.find(
        (p) => p.name.toLowerCase() === data.providerName!.toLowerCase()
      );
      if (match) {
        providerId = match.id;
      } else {
        const created = await prisma.provider.create({
          data: {
            name: data.providerName,
            phone: data.providerPhone,
            website: data.providerWebsite,
          },
        });
        providerId = created.id;
      }
    }

    // Ensure the provider is linked to this category.
    const link = await prisma.providerCategory.findUnique({
      where: { providerId_categoryId: { providerId, categoryId: category.id } },
    });
    if (!link) {
      await prisma.providerCategory.create({
        data: { providerId, categoryId: category.id },
      });
    }

    const rec = await prisma.recommendation.upsert({
      where: {
        authorId_providerId_categoryId: {
          authorId: me.id,
          providerId,
          categoryId: category.id,
        },
      },
      create: {
        providerId,
        categoryId: category.id,
        authorId: me.id,
        neighborhoodId: me.neighborhoodId,
        rating: data.rating,
        recommend: data.recommend,
        timesUsed: data.timesUsed,
        pricePaid: data.pricePaid,
        comment: data.comment,
        groupInterest: data.groupInterest,
        groupTargetDate: data.groupTargetDate,
      },
      update: {
        rating: data.rating,
        recommend: data.recommend,
        timesUsed: data.timesUsed,
        pricePaid: data.pricePaid,
        comment: data.comment,
        groupInterest: data.groupInterest,
        groupTargetDate: data.groupTargetDate,
      },
    });

    res.status(201).json({ recommendation: rec });
  })
);

// Bookmarks ----------------------------------------------------------------

recommendationsRouter.get(
  "/bookmarks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.auth!.userId },
      include: { provider: { include: { categories: { include: { category: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookmarks });
  })
);

recommendationsRouter.post(
  "/bookmarks/:providerId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const existing = await prisma.bookmark.findUnique({
      where: { userId_providerId: { userId: req.auth!.userId, providerId } },
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false });
    }
    await prisma.bookmark.create({ data: { userId: req.auth!.userId, providerId } });
    res.json({ bookmarked: true });
  })
);
