import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";

export const geoRouter = Router();

// Full geography tree: states -> counties -> cities -> neighborhoods
geoRouter.get(
  "/tree",
  asyncHandler(async (_req, res) => {
    const states = await prisma.state.findMany({
      include: {
        counties: {
          include: {
            cities: {
              include: {
                neighborhoods: { orderBy: { name: "asc" } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ states });
  })
);

// Flat list of neighborhoods (with full geo path) for selectors
geoRouter.get(
  "/neighborhoods",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string | undefined)?.toLowerCase();
    const neighborhoods = await prisma.neighborhood.findMany({
      include: { city: { include: { county: { include: { state: true } } } } },
      orderBy: { name: "asc" },
    });
    const result = neighborhoods
      .map((n) => ({
        id: n.id,
        name: n.name,
        slug: n.slug,
        zip: n.zip,
        homeCount: n.homeCount,
        description: n.description,
        city: n.city.name,
        county: n.city.county.name,
        state: n.city.county.state.name,
        stateCode: n.city.county.state.code,
        path: `${n.name}, ${n.city.name}, ${n.city.county.name} County, ${n.city.county.state.code}`,
      }))
      .filter((n) => !search || n.path.toLowerCase().includes(search));
    res.json({ neighborhoods: result });
  })
);

geoRouter.get(
  "/neighborhoods/:slug",
  asyncHandler(async (req, res) => {
    const n = await prisma.neighborhood.findUnique({
      where: { slug: req.params.slug },
      include: { city: { include: { county: { include: { state: true } } } } },
    });
    if (!n) return res.status(404).json({ error: "Neighborhood not found" });
    res.json({
      neighborhood: {
        id: n.id,
        name: n.name,
        slug: n.slug,
        zip: n.zip,
        homeCount: n.homeCount,
        description: n.description,
        city: n.city.name,
        county: n.city.county.name,
        state: n.city.county.state.name,
        stateCode: n.city.county.state.code,
        path: `${n.name}, ${n.city.name}, ${n.city.county.name} County, ${n.city.county.state.code}`,
      },
    });
  })
);

geoRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.serviceCategory.findMany({ orderBy: { name: "asc" } });
    res.json({ categories });
  })
);
