import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";
import { requireAuth } from "../auth.js";

export const providersRouter = Router();

interface ProviderStats {
  neighborCount: number; // distinct neighbors in scope who recommended
  recommendationCount: number;
  avgRating: number | null;
  recommendRate: number | null; // fraction that would recommend
}

function computeStats(
  recs: { authorId: string; rating: number; recommend: boolean }[]
): ProviderStats {
  if (recs.length === 0) {
    return { neighborCount: 0, recommendationCount: 0, avgRating: null, recommendRate: null };
  }
  const neighbors = new Set(recs.map((r) => r.authorId));
  const avg = recs.reduce((s, r) => s + r.rating, 0) / recs.length;
  const recommendRate = recs.filter((r) => r.recommend).length / recs.length;
  return {
    neighborCount: neighbors.size,
    recommendationCount: recs.length,
    avgRating: Math.round(avg * 10) / 10,
    recommendRate: Math.round(recommendRate * 100) / 100,
  };
}

/**
 * GET /api/providers
 * Query: neighborhoodId, categorySlug, search, scope (neighborhood|city|county|all)
 * Returns providers with neighbor-scoped social-proof stats, ranked by neighbor count.
 */
providersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { neighborhoodId, categorySlug, search } = req.query as Record<string, string>;
    const scope = (req.query.scope as string) || "neighborhood";

    // Resolve the set of neighborhood ids included in the social-proof scope.
    let scopeNeighborhoodIds: string[] | null = null;
    if (neighborhoodId && scope !== "all") {
      const hood = await prisma.neighborhood.findUnique({
        where: { id: neighborhoodId },
        include: { city: { include: { county: true } } },
      });
      if (hood) {
        if (scope === "neighborhood") {
          scopeNeighborhoodIds = [hood.id];
        } else if (scope === "city") {
          const hoods = await prisma.neighborhood.findMany({
            where: { cityId: hood.cityId },
            select: { id: true },
          });
          scopeNeighborhoodIds = hoods.map((h) => h.id);
        } else if (scope === "county") {
          const cities = await prisma.city.findMany({
            where: { countyId: hood.city.countyId },
            select: { id: true },
          });
          const hoods = await prisma.neighborhood.findMany({
            where: { cityId: { in: cities.map((c) => c.id) } },
            select: { id: true },
          });
          scopeNeighborhoodIds = hoods.map((h) => h.id);
        }
      }
    }

    let categoryId: string | undefined;
    if (categorySlug) {
      const cat = await prisma.serviceCategory.findUnique({ where: { slug: categorySlug } });
      categoryId = cat?.id;
    }

    const providers = await prisma.provider.findMany({
      where: {
        ...(categoryId ? { categories: { some: { categoryId } } } : {}),
        ...(search
          ? { name: { contains: search } }
          : {}),
      },
      include: {
        categories: { include: { category: true } },
        recommendations: {
          where: {
            ...(categoryId ? { categoryId } : {}),
            ...(scopeNeighborhoodIds ? { neighborhoodId: { in: scopeNeighborhoodIds } } : {}),
          },
          select: { authorId: true, rating: true, recommend: true },
        },
      },
    });

    const result = providers
      .map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        website: p.website,
        email: p.email,
        description: p.description,
        serviceArea: p.serviceArea,
        verified: p.verified,
        categories: p.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
          icon: c.category.icon,
        })),
        stats: computeStats(p.recommendations),
      }))
      // When scoped, only surface providers that neighbors have actually used.
      .filter((p) => (scopeNeighborhoodIds ? p.stats.recommendationCount > 0 : true))
      .sort((a, b) => {
        if (b.stats.neighborCount !== a.stats.neighborCount)
          return b.stats.neighborCount - a.stats.neighborCount;
        return (b.stats.avgRating ?? 0) - (a.stats.avgRating ?? 0);
      });

    res.json({ providers: result });
  })
);

providersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const scopeNeighborhoodId = req.query.neighborhoodId as string | undefined;
    const p = await prisma.provider.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { include: { category: true } },
        recommendations: {
          include: {
            author: { select: { id: true, name: true } },
            category: true,
            neighborhood: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!p) return res.status(404).json({ error: "Provider not found" });

    const inScope = scopeNeighborhoodId
      ? p.recommendations.filter((r) => r.neighborhoodId === scopeNeighborhoodId)
      : p.recommendations;

    res.json({
      provider: {
        id: p.id,
        name: p.name,
        phone: p.phone,
        website: p.website,
        email: p.email,
        description: p.description,
        serviceArea: p.serviceArea,
        verified: p.verified,
        categories: p.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
          icon: c.category.icon,
        })),
        stats: computeStats(p.recommendations),
        scopedStats: computeStats(inScope),
        recommendations: p.recommendations.map((r) => ({
          id: r.id,
          rating: r.rating,
          recommend: r.recommend,
          timesUsed: r.timesUsed,
          pricePaid: r.pricePaid,
          comment: r.comment,
          groupInterest: r.groupInterest,
          groupTargetDate: r.groupTargetDate,
          author: r.author.name,
          authorId: r.author.id,
          category: { name: r.category.name, slug: r.category.slug },
          neighborhood: r.neighborhood.name,
          createdAt: r.createdAt,
        })),
      },
    });
  })
);

const createProviderSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  description: z.string().optional(),
  serviceArea: z.string().optional(),
  categorySlugs: z.array(z.string()).optional(),
});

providersRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createProviderSchema.parse(req.body);
    const categories = data.categorySlugs?.length
      ? await prisma.serviceCategory.findMany({ where: { slug: { in: data.categorySlugs } } })
      : [];
    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        phone: data.phone,
        website: data.website,
        email: data.email,
        description: data.description,
        serviceArea: data.serviceArea,
        categories: { create: categories.map((c) => ({ categoryId: c.id })) },
      },
      include: { categories: { include: { category: true } } },
    });
    res.status(201).json({ provider });
  })
);
