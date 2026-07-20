import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

// POST /api/itineraries — Create new itinerary
router.post("/", async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { title, shortDescription, fullDescription, budget, travelDates, imageUrl, destination, startDate, endDate } = req.body;

        if (!title) return res.status(400).json({ message: "Title required" });

        const db = getDb();

        const doc = {
            userId: new ObjectId(user._id),
            title,
            shortDescription: shortDescription || "",
            fullDescription: fullDescription || "",
            budget: budget || 0,
            destination: destination || "",
            imageUrl: imageUrl || "",
            travelDates: travelDates || (startDate && endDate ? { start: startDate, end: endDate } : null),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("itineraries").insertOne(doc);
        res.status(201).json({ _id: result.insertedId, ...doc });
    } catch (error) {
        console.error("Create itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/itineraries/user — Get current user's itineraries
router.get("/user", async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const db = getDb();
        const itineraries = await db
            .collection("itineraries")
            .find({ userId: new ObjectId(user._id) })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(itineraries);
    } catch (error) {
        console.error("Get itineraries error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/itineraries/:id — Get single itinerary
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const db = getDb();
        const itinerary = await db.collection("itineraries").findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(user._id),
        });

        if (!itinerary) return res.status(404).json({ message: "Not found" });
        res.json(itinerary);
    } catch (error) {
        console.error("Get itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/itineraries/:id — Update itinerary
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const db = getDb();
        const { title, shortDescription, fullDescription, budget, travelDates, imageUrl, destination } = req.body;

        const result = await db.collection("itineraries").findOneAndUpdate(
            { _id: new ObjectId(req.params.id), userId: new ObjectId(user._id) },
            {
                $set: {
                    title,
                    shortDescription,
                    fullDescription,
                    budget,
                    travelDates,
                    imageUrl,
                    destination,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: "after" }
        );

        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        console.error("Update itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// PATCH /api/itineraries/:id/travel — Mark as travelled
router.patch("/:id/travel", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        await db.collection("itineraries").updateOne(
            { _id: new ObjectId(req.params.id), userId: new ObjectId((req as any).user._id) },
            { $set: { travelled: true, travelledAt: new Date() } }
        );
        res.json({ message: "Marked as travelled" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/user/expenses — Get expense data for charts
router.get("/expenses", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const expenses = await db.collection("itineraries").aggregate([
            { $match: { userId: new ObjectId((req as any).user._id), travelled: true, travelledAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$travelledAt" } }, total: { $sum: "$budget" } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        res.json(expenses);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});



// DELETE /api/itineraries/:id — Delete itinerary
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const db = getDb();

        const result = await db.collection("itineraries").deleteOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(user._id),
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Not found" });
        }

        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Delete itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;