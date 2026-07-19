import { Router, Request, Response } from "express";
import { getDb } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { search, category, minPrice, maxPrice, rating, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "12" } = req.query;
        const query: any = {};
        if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { shortDescription: { $regex: search, $options: "i" } }];
        if (category) query.category = category;
        if (minPrice || maxPrice) query.priceRange = { $gte: Number(minPrice) || 0, $lte: Number(maxPrice) || Infinity };
        if (rating) query.rating = { $gte: Number(rating) };

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 12;
        const sortObj: any = { [sortBy as string]: sortOrder === "asc" ? 1 : -1 };

        const [data, total] = await Promise.all([
            db.collection("destinations").find(query).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).toArray(),
            db.collection("destinations").countDocuments(query),
        ]);
        res.json({ data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/:slug", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const dest = await db.collection("destinations").findOne({ slug: req.params.slug });
        if (!dest) return res.status(404).json({ message: "Not found" });
        res.json(dest);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;