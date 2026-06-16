import "dotenv/config";
import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { attachUser } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { geoRouter } from "./routes/geo.js";
import { providersRouter } from "./routes/providers.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { groupDealsRouter } from "./routes/groupDeals.js";
import { askRouter } from "./routes/ask.js";
import { statsRouter } from "./routes/stats.js";

/** Builds the Express app. Exported so tests can mount it without listening. */
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN?.split(",") ?? true,
    })
  );
  app.use(express.json());
  app.use(attachUser);

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "neighbornest" }));

  app.use("/api/auth", authRouter);
  app.use("/api/geo", geoRouter);
  app.use("/api/providers", providersRouter);
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/deals", groupDealsRouter);
  app.use("/api/ask", askRouter);
  app.use("/api/stats", statsRouter);

  // Centralized error handler.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.flatten() });
      }
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}

export const app = createApp();
