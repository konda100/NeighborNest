import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";

export const statsRouter = Router();

// Neighborhood dashboard: headline numbers for a hub.
statsRouter.get(
  "/neighborhood/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const neighborhood = await prisma.neighborhood.findUnique({ where: { id } });
    if (!neighborhood) return res.status(404).json({ error: "Neighborhood not found" });

    const [recCount, residentCount, deals, askCount, recs] = await Promise.all([
      prisma.recommendation.count({ where: { neighborhoodId: id } }),
      prisma.user.count({ where: { neighborhoodId: id } }),
      prisma.groupDeal.findMany({
        where: { neighborhoodId: id },
        include: { commitments: true },
      }),
      prisma.askPost.count({ where: { neighborhoodId: id } }),
      prisma.recommendation.findMany({
        where: { neighborhoodId: id },
        select: { providerId: true },
      }),
    ]);

    const providerCount = new Set(recs.map((r) => r.providerId)).size;

    // Realized community savings from confirmed/completed deals.
    let realizedSavings = 0;
    let activeDeals = 0;
    for (const d of deals) {
      if (["confirmed", "completed"].includes(d.status) && d.soloPrice && d.groupPrice) {
        realizedSavings += Math.max(d.soloPrice - d.groupPrice, 0) * d.commitments.length;
      }
      if (["collecting", "negotiating", "confirmed"].includes(d.status)) activeDeals += 1;
    }

    res.json({
      stats: {
        residents: residentCount,
        homeCount: neighborhood.homeCount,
        providers: providerCount,
        recommendations: recCount,
        askPosts: askCount,
        activeDeals,
        totalDeals: deals.length,
        realizedSavings,
      },
    });
  })
);
