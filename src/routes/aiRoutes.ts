import { Router, Request, Response } from "express";
import { getRecommendations } from "../services/recommendation";
import { generateItineraryStream } from "../services/itineraryGenerator";
import { getDb } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

router.post("/recommend", async (req: Request, res: Response) => {
    try {
        const { budget, interests, travelStyle } = req.body;
        if (!interests || !budget) {
            return res.status(400).json({ message: "budget and interests required" });
        }
        const db = getDb();
        const destinations = await db.collection("destinations").find({}).toArray();
        const recommendations = await getRecommendations({ budget, interests, travelStyle }, destinations);

        const user = (req as any).user;
        if (user) {
            await db.collection("recommendation_logs").insertOne({
                userId: new ObjectId(user._id),
                query: { budget, interests, travelStyle },
                results: recommendations,
                timestamp: new Date(),
            });
        }
        res.json(recommendations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI recommendation failed" });
    }
});

router.post("/generate-itinerary", async (req: Request, res: Response) => {
    try {
        const { destination, days, budget, interests, length = "detailed" } = req.body;
        if (!destination || !days) {
            return res.status(400).json({ message: "destination and days required" });
        }
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        const stream = generateItineraryStream({ destination, days, budget, interests, length });
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        res.end();
    }
});

export default router;