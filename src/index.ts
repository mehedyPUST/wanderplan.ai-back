import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, ensureIndexes } from "./db";
import { registerUser, loginUser } from "./auth";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: [
        'https://wanderplan-ai-front.vercel.app',
        'http://localhost:3000'
    ],
    credentials: true,
    exposedHeaders: ['set-cookie'],
}));



app.options("*", cors());
app.use(express.json());
app.use(cookieParser());

// Cookie config based on environment
const getCookieConfig = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
});

// Auth routes
app.post("/api/auth/sign-up/email", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = await registerUser(email, password, name);
        const { token } = await loginUser(email, password);
        res.cookie('token', token, getCookieConfig());
        res.json({ user });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

app.post("/api/auth/sign-in/email", async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await loginUser(email, password);
        res.cookie('token', token, getCookieConfig());
        res.json({ user });
    } catch (err: any) {
        res.status(401).json({ message: err.message });
    }
});

app.post("/api/auth/sign-out", (_req, res) => {
    res.clearCookie('token', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    });
    res.json({ message: 'Logged out' });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

async function start() {
    await connectDB();
    await ensureIndexes();

    const { requireAuth } = await import("./middleware/authMiddleware");

    const { default: destinationRoutes } = await import("./routes/destinationRoutes");
    app.use("/api/destinations", destinationRoutes);

    const { default: userRoutes } = await import("./routes/userRoutes");
    app.use("/api/user", requireAuth, userRoutes);

    const { default: itineraryRoutes } = await import("./routes/itineraryRoutes");
    app.use("/api/itineraries", requireAuth, itineraryRoutes);

    const { default: uploadRoutes } = await import("./routes/uploadRoutes");
    app.use("/api/upload", requireAuth, uploadRoutes);

    const { default: reviewRoutes } = await import("./routes/reviewRoutes");
    app.use("/api/reviews", reviewRoutes);

    const { default: aiRoutes } = await import("./routes/aiRoutes");
    app.use("/api/ai", aiRoutes);

    const { default: wishlistRoutes } = await import("./routes/wishlistRoutes");
    app.use("/api/wishlist", requireAuth, wishlistRoutes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
start();

export default app;