import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { signToken, requireAuth } from "../auth.js";
import { asyncHandler } from "../util.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  streetAddress: z.string().optional(),
  neighborhoodId: z.string().optional(),
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  streetAddress: true,
  neighborhoodId: true,
  neighborhood: {
    include: { city: { include: { county: { include: { state: true } } } } },
  },
} as const;

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        streetAddress: data.streetAddress,
        neighborhoodId: data.neighborhoodId,
      },
      select: userSelect,
    });
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ token, user });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken({ userId: user.id, role: user.role });
    const safe = await prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
    res.json({ token, user: safe });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: userSelect,
    });
    res.json({ user });
  })
);

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  streetAddress: z.string().optional(),
  neighborhoodId: z.string().optional(),
});

authRouter.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = updateMeSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data,
      select: userSelect,
    });
    res.json({ user });
  })
);
