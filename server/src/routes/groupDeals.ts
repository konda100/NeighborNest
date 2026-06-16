import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";
import { requireAuth } from "../auth.js";

export const groupDealsRouter = Router();

function dealView(deal: any, currentUserId?: string) {
  const committed = deal.commitments.length;
  const savingsPerHome =
    deal.soloPrice != null && deal.groupPrice != null
      ? Math.max(deal.soloPrice - deal.groupPrice, 0)
      : null;
  return {
    id: deal.id,
    title: deal.title,
    description: deal.description,
    targetDate: deal.targetDate,
    minHomes: deal.minHomes,
    soloPrice: deal.soloPrice,
    groupPrice: deal.groupPrice,
    status: deal.status,
    category: deal.category
      ? { name: deal.category.name, slug: deal.category.slug, icon: deal.category.icon }
      : null,
    neighborhood: deal.neighborhood ? { id: deal.neighborhood.id, name: deal.neighborhood.name } : null,
    organizer: deal.organizer ? { id: deal.organizer.id, name: deal.organizer.name } : null,
    provider: deal.provider ? { id: deal.provider.id, name: deal.provider.name } : null,
    committedHomes: committed,
    progress: deal.minHomes > 0 ? Math.min(committed / deal.minHomes, 1) : 0,
    criticalMassReached: committed >= deal.minHomes,
    savingsPerHome,
    totalCommunitySavings: savingsPerHome != null ? savingsPerHome * committed : null,
    committedBy: deal.commitments.map((c: any) => ({ id: c.user.id, name: c.user.name })),
    iCommitted: currentUserId
      ? deal.commitments.some((c: any) => c.userId === currentUserId)
      : false,
    createdAt: deal.createdAt,
  };
}

const dealInclude = {
  category: true,
  neighborhood: true,
  organizer: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true } },
  commitments: { include: { user: { select: { id: true, name: true } } } },
} as const;

groupDealsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { neighborhoodId, status } = req.query as Record<string, string>;
    const deals = await prisma.groupDeal.findMany({
      where: {
        ...(neighborhoodId ? { neighborhoodId } : {}),
        ...(status ? { status } : {}),
      },
      include: dealInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ deals: deals.map((d) => dealView(d, req.auth?.userId)) });
  })
);

groupDealsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const deal = await prisma.groupDeal.findUnique({
      where: { id: req.params.id },
      include: dealInclude,
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json({ deal: dealView(deal, req.auth?.userId) });
  })
);

const createSchema = z.object({
  title: z.string().min(1),
  categorySlug: z.string(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  minHomes: z.number().int().min(2).default(6),
  soloPrice: z.number().int().optional(),
  neighborhoodId: z.string().optional(),
});

groupDealsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const me = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    const neighborhoodId = data.neighborhoodId || me?.neighborhoodId;
    if (!neighborhoodId) {
      return res.status(400).json({ error: "A neighborhood is required to start a group deal" });
    }
    const category = await prisma.serviceCategory.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) return res.status(400).json({ error: "Unknown service category" });

    const deal = await prisma.groupDeal.create({
      data: {
        title: data.title,
        categoryId: category.id,
        neighborhoodId,
        organizerId: me!.id,
        description: data.description,
        targetDate: data.targetDate,
        minHomes: data.minHomes,
        soloPrice: data.soloPrice,
      },
      include: dealInclude,
    });
    // Organizer auto-commits.
    await prisma.groupDealCommitment.create({
      data: { dealId: deal.id, userId: me!.id },
    });
    const full = await prisma.groupDeal.findUnique({
      where: { id: deal.id },
      include: dealInclude,
    });
    res.status(201).json({ deal: dealView(full, me!.id) });
  })
);

// Toggle commitment ("I'm in!")
groupDealsRouter.post(
  "/:id/commit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const dealId = req.params.id;
    const userId = req.auth!.userId;
    const existing = await prisma.groupDealCommitment.findUnique({
      where: { dealId_userId: { dealId, userId } },
    });
    if (existing) {
      await prisma.groupDealCommitment.delete({ where: { id: existing.id } });
    } else {
      await prisma.groupDealCommitment.create({ data: { dealId, userId } });
    }
    const deal = await prisma.groupDeal.findUnique({ where: { id: dealId }, include: dealInclude });
    res.json({ deal: dealView(deal, userId) });
  })
);

const updateSchema = z.object({
  status: z.enum(["collecting", "negotiating", "confirmed", "completed", "cancelled"]).optional(),
  groupPrice: z.number().int().optional(),
  soloPrice: z.number().int().optional(),
  providerId: z.string().optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  minHomes: z.number().int().min(2).optional(),
});

// Organizer-only updates (set negotiated price, provider, status).
groupDealsRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const deal = await prisma.groupDeal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (deal.organizerId !== req.auth!.userId && req.auth!.role !== "admin") {
      return res.status(403).json({ error: "Only the organizer can update this deal" });
    }
    const data = updateSchema.parse(req.body);
    const updated = await prisma.groupDeal.update({
      where: { id: deal.id },
      data,
      include: dealInclude,
    });
    res.json({ deal: dealView(updated, req.auth!.userId) });
  })
);
