import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/:destinationId", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const reviews = await db.collection("reviews")
            .find({ destinationId: new ObjectId(req.params.destinationId) })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(reviews);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const doc = {
            destinationId: new ObjectId(req.body.destinationId),
            userId: new ObjectId((req as any).user.id),
            rating: req.body.rating,
            comment: req.body.comment,
            createdAt: new Date(),
        };
        await db.collection("reviews").insertOne(doc);
        res.status(201).json({ message: "Review added" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;