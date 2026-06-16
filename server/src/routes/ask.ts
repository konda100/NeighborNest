import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util.js";
import { requireAuth } from "../auth.js";

export const askRouter = Router();

askRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { neighborhoodId, search } = req.query as Record<string, string>;
    const posts = await prisma.askPost.findMany({
      where: {
        ...(neighborhoodId ? { neighborhoodId } : {}),
        ...(search ? { title: { contains: search } } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        neighborhood: { select: { id: true, name: true } },
        replies: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ posts });
  })
);

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  neighborhoodId: z.string().optional(),
});

askRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createPostSchema.parse(req.body);
    const me = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    const neighborhoodId = data.neighborhoodId || me?.neighborhoodId;
    if (!neighborhoodId) {
      return res.status(400).json({ error: "A neighborhood is required to post" });
    }
    const post = await prisma.askPost.create({
      data: {
        title: data.title,
        body: data.body,
        neighborhoodId,
        authorId: me!.id,
      },
      include: {
        author: { select: { id: true, name: true } },
        neighborhood: { select: { id: true, name: true } },
        replies: true,
      },
    });
    res.status(201).json({ post });
  })
);

const replySchema = z.object({ body: z.string().min(1) });

askRouter.post(
  "/:id/replies",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = replySchema.parse(req.body);
    const post = await prisma.askPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    const reply = await prisma.askReply.create({
      data: { postId: post.id, authorId: req.auth!.userId, body: data.body },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ reply });
  })
);
