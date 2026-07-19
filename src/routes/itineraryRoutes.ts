import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const doc = {
            userId: new ObjectId((req as any).user.id),
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection("itineraries").insertOne(doc);
        res.status(201).json({ _id: result.insertedId, ...doc });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/user", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const items = await db.collection("itineraries")
            .find({ userId: new ObjectId((req as any).user.id) })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(items);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        await db.collection("itineraries").deleteOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId((req as any).user.id),
        });
        res.json({ message: "Deleted" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;