import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { generateFeaturedDestinations } from "../services/featuredService";

const router = Router();

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

                // ✅ FORCE replace ALL image URLs with working ones
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
                if (featured?.destinations) {
                    // ✅ Fix images in cached data too
                    const fixed = featured.destinations.map((dest: any) => ({
                        ...dest,
                        image: getImageForCategory(dest.category || 'default')
                    }));
                    return res.json(fixed);
                }
            }
        } else {
            // ✅ Fix images in existing data too
            const fixed = featured.destinations.map((dest: any) => ({
                ...dest,
                image: getImageForCategory(dest.category || 'default')
            }));
            return res.json(fixed);
        }

        // Fallback
        const fallback = [
            { name: "Bali, Indonesia", slug: "bali-indonesia", country: "Indonesia", category: "beach", image: getImageForCategory("beach"), shortDescription: "Tropical paradise with stunning beaches.", priceRange: { min: 500, max: 1500 }, rating: 4.7, tags: ["beach"], reason: "Perfect weather this season" },
            { name: "Paris, France", slug: "paris-france", country: "France", category: "city", image: getImageForCategory("city"), shortDescription: "The City of Light.", priceRange: { min: 1000, max: 3000 }, rating: 4.8, tags: ["culture"], reason: "Summer festivals" },
            { name: "Tokyo, Japan", slug: "tokyo-japan", country: "Japan", category: "city", image: getImageForCategory("city"), shortDescription: "Ultramodern metropolis.", priceRange: { min: 800, max: 2500 }, rating: 4.9, tags: ["food"], reason: "Cherry blossom season" },
            { name: "Santorini, Greece", slug: "santorini-greece", country: "Greece", category: "beach", image: getImageForCategory("beach"), shortDescription: "Iconic blue-domed churches.", priceRange: { min: 800, max: 2500 }, rating: 4.8, tags: ["romantic"], reason: "Best sunsets" },
            { name: "Swiss Alps", slug: "swiss-alps", country: "Switzerland", category: "mountain", image: getImageForCategory("mountain"), shortDescription: "Majestic peaks.", priceRange: { min: 1500, max: 5000 }, rating: 4.9, tags: ["adventure"], reason: "Peak skiing season" },
            { name: "Maldives", slug: "maldives", country: "Maldives", category: "beach", image: getImageForCategory("beach"), shortDescription: "Overwater villas.", priceRange: { min: 2000, max: 5000 }, rating: 4.9, tags: ["luxury"], reason: "Dry season" }
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