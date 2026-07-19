import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/wishlist — get user's wishlist
router.get("/", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const wishlist = await db.collection("wishlists")
            .find({ userId: new ObjectId((req as any).user._id) })
            .toArray();
        res.json(wishlist);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/wishlist — add to wishlist
router.post("/", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { name, country, slug } = req.body;
        const existing = await db.collection("wishlists").findOne({
            userId: new ObjectId((req as any).user._id),
            slug,
        });
        if (existing) {
            return res.status(400).json({ message: "Already in wishlist" });
        }
        await db.collection("wishlists").insertOne({
            userId: new ObjectId((req as any).user._id),
            name,
            country,
            slug,
            createdAt: new Date(),
        });
        res.status(201).json({ message: "Added to wishlist" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/wishlist/:slug — remove from wishlist
router.delete("/:slug", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        await db.collection("wishlists").deleteOne({
            userId: new ObjectId((req as any).user._id),
            slug: req.params.slug,
        });
        res.json({ message: "Removed from wishlist" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/wishlist/:slug — check if in wishlist
router.get("/:slug", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const item = await db.collection("wishlists").findOne({
            userId: new ObjectId((req as any).user._id),
            slug: req.params.slug,
        });
        res.json({ saved: !!item });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;