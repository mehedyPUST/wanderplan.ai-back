import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, ensureIndexes } from "./db";
import { registerUser, loginUser } from "./auth";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: ['https://wanderplan-ai-front.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie'],
}));
app.options("*", cors());
app.use(express.json());
app.use(cookieParser());

// AUTH ROUTES
app.post("/api/auth/sign-up/email", async (req, res) => {
    try {
        await connectDB();
        const { email, password, name } = req.body;
        const user = await registerUser(email, password, name);
        const { token } = await loginUser(email, password);
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
        res.json({ user });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

app.post("/api/auth/sign-in/email", async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;
        const { token, user } = await loginUser(email, password);
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
        res.json({ user });
    } catch (err: any) {
        res.status(401).json({ message: err.message });
    }
});

app.post("/api/auth/sign-out", (_req, res) => {
    res.setHeader('Set-Cookie', `token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`);
    res.json({ message: 'Logged out' });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// DESTINATIONS
app.use("/api/destinations", async (req, res, next) => {
    await connectDB();
    const { default: destinationRoutes } = await import("./routes/destinationRoutes");
    destinationRoutes(req, res, next);
});

// USER PROFILE
app.use("/api/user", async (req, res, next) => {
    await connectDB();
    const { requireAuth } = await import("./middleware/authMiddleware");
    const { default: userRoutes } = await import("./routes/userRoutes");
    requireAuth(req, res, () => userRoutes(req, res, next));
});

// ITINERARIES
app.use("/api/itineraries", async (req, res, next) => {
    await connectDB();
    const { requireAuth } = await import("./middleware/authMiddleware");
    const { default: itineraryRoutes } = await import("./routes/itineraryRoutes");
    requireAuth(req, res, () => itineraryRoutes(req, res, next));
});

// UPLOAD
app.use("/api/upload", async (req, res, next) => {
    await connectDB();
    const { requireAuth } = await import("./middleware/authMiddleware");
    const { default: uploadRoutes } = await import("./routes/uploadRoutes");
    requireAuth(req, res, () => uploadRoutes(req, res, next));
});

// REVIEWS
app.use("/api/reviews", async (req, res, next) => {
    await connectDB();
    const { default: reviewRoutes } = await import("./routes/reviewRoutes");
    reviewRoutes(req, res, next);
});

// AI
app.use("/api/ai", async (req, res, next) => {
    const { default: aiRoutes } = await import("./routes/aiRoutes");
    aiRoutes(req, res, next);
});

// WISHLIST
app.use("/api/wishlist", async (req, res, next) => {
    await connectDB();
    const { requireAuth } = await import("./middleware/authMiddleware");
    const { default: wishlistRoutes } = await import("./routes/wishlistRoutes");
    requireAuth(req, res, () => wishlistRoutes(req, res, next));
});

// Local dev only
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => {
        ensureIndexes();
        app.listen(5000, () => console.log("http://localhost:5000"));
    });
}

export default app;
