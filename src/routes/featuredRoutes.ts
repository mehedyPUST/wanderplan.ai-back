import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { generateFeaturedDestinations } from "../services/featuredService";

const router = Router();

// GET /api/featured — Get current featured destinations (auto-refresh if expired)
router.get("/", async (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const featured = await db.collection("featured").findOne({ type: "destinations" });

        // Auto-refresh if never generated or expired (7 days)
        if (!featured || !featured.nextRefresh || new Date() > new Date(featured.nextRefresh)) {
            const destinations = await generateFeaturedDestinations();
            await db.collection("featured").updateOne(
                { type: "destinations" },
                {
                    $set: {
                        destinations,
                        updatedAt: new Date(),
                        nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                    }
                },
                { upsert: true }
            );
            return res.json(destinations);
        }

        res.json(featured.destinations);
    } catch (error) {
        console.error("Featured error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/featured/refresh — Force refresh
router.post("/refresh", async (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const destinations = await generateFeaturedDestinations();

        await db.collection("featured").updateOne(
            { type: "destinations" },
            {
                $set: {
                    destinations,
                    updatedAt: new Date(),
                    nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            },
            { upsert: true }
        );

        res.json({ message: "Featured refreshed", destinations });
    } catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
});

export default router;