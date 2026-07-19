import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { changeUserPassword } from "../auth";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/profile", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const user = await db.collection("users").findOne(
            { _id: new ObjectId((req as any).user._id) },
            { projection: { password: 0 } }
        );
        res.json(user);
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/profile", async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { name, avatar, preferences } = req.body;
        await db.collection("users").updateOne(
            { _id: new ObjectId((req as any).user._id) },
            { $set: { name, avatar, preferences, updatedAt: new Date() } }
        );
        res.json({ message: "Profile updated" });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/password", async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await changeUserPassword((req as any).user._id, currentPassword, newPassword);
        res.json({ message: "Password changed" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export default router;