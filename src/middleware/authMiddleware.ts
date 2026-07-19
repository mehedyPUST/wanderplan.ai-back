import { Request, Response, NextFunction } from "express";
import { verifyToken, getUserFromToken } from "../auth";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const user = await getUserFromToken(token);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        (req as any).user = user;
        next();
    } catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
};