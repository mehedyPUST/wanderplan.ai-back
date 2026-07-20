import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { generateFeaturedDestinations } from "../services/featuredService";

const router = Router();

// Real working images by category
function getImageForCategory(category: string): string {
    const images: Record<string, string> = {
        beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
        city: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop",
        mountain: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
        nature: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
        default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop"
    };
    return images[category] || images.default;
}

// GET /api/featured
router.get("/", async (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const featured = await db.collection("featured").findOne({ type: "destinations" });

        if (!featured || !featured.nextRefresh || new Date() > new Date(featured.nextRefresh)) {
            try {
                let destinations = await generateFeaturedDestinations();
                // Fix images with real working URLs
                destinations = destinations.map((dest: any) => ({
                    ...dest,
                    image: getImageForCategory(dest.category || 'default')
                }));

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
                return res.json(destinations);
            } catch (aiError) {
                console.error("AI featured failed:", aiError);
                if (featured?.destinations) return res.json(featured.destinations);
            }
        } else {
            return res.json(featured.destinations);
        }

        // Fallback data
        const fallback = [
            {
                name: "Bali, Indonesia", slug: "bali-indonesia", country: "Indonesia",
                image: getImageForCategory("beach"),
                shortDescription: "Tropical paradise with stunning beaches and rich culture.",
                priceRange: { min: 500, max: 1500 }, rating: 4.7, category: "beach",
                tags: ["beach", "culture"], reason: "Perfect weather this season"
            },
            {
                name: "Paris, France", slug: "paris-france", country: "France",
                image: getImageForCategory("city"),
                shortDescription: "The City of Light — romance, art, and cuisine.",
                priceRange: { min: 1000, max: 3000 }, rating: 4.8, category: "city",
                tags: ["romantic", "culture"], reason: "Summer festivals in full swing"
            },
            {
                name: "Tokyo, Japan", slug: "tokyo-japan", country: "Japan",
                image: getImageForCategory("city"),
                shortDescription: "Ultramodern metropolis with ancient temples.",
                priceRange: { min: 800, max: 2500 }, rating: 4.9, category: "city",
                tags: ["city", "food"], reason: "Cherry blossom season approaching"
            },
            {
                name: "Santorini, Greece", slug: "santorini-greece", country: "Greece",
                image: getImageForCategory("beach"),
                shortDescription: "Iconic blue-domed churches and breathtaking sunsets.",
                priceRange: { min: 800, max: 2500 }, rating: 4.8, category: "beach",
                tags: ["beach", "romantic"], reason: "Best sunsets of the year"
            },
            {
                name: "Swiss Alps", slug: "swiss-alps", country: "Switzerland",
                image: getImageForCategory("mountain"),
                shortDescription: "Majestic peaks and world-class skiing.",
                priceRange: { min: 1500, max: 5000 }, rating: 4.9, category: "mountain",
                tags: ["mountain", "adventure"], reason: "Peak skiing season"
            },
            {
                name: "Maldives", slug: "maldives", country: "Maldives",
                image: getImageForCategory("beach"),
                shortDescription: "Overwater villas and crystal clear waters.",
                priceRange: { min: 2000, max: 5000 }, rating: 4.9, category: "beach",
                tags: ["beach", "luxury"], reason: "Dry season with perfect weather"
            }
        ];

        res.json(fallback);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/featured/refresh
router.post("/refresh", async (_req: Request, res: Response) => {
    try {
        const db = getDb();
        let destinations = await generateFeaturedDestinations();
        destinations = destinations.map((dest: any) => ({
            ...dest,
            image: getImageForCategory(dest.category || 'default')
        }));

        await db.collection("featured").updateOne(
            { type: "destinations" },
            { $set: { destinations, updatedAt: new Date(), nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
            { upsert: true }
        );

        res.json({ message: "Featured refreshed", destinations });
    } catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
});

export default router;