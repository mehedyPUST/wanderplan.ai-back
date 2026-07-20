import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, ensureIndexes } from "./db";
import { registerUser, loginUser, verifyGoogleToken, googleLogin, generateToken } from "./auth";

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

// Google OAuth (One Tap)
app.post("/api/auth/google", async (req, res) => {
    try {
        await connectDB();
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Google token required" });
        const payload = await verifyGoogleToken(token);
        if (!payload || !payload.email) return res.status(400).json({ message: "Invalid Google token" });
        const user = await googleLogin(payload.email, payload.name || 'Traveler', payload.picture);
        const jwtToken = generateToken(user.id);
        res.setHeader('Set-Cookie', `token=${jwtToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
        res.json({ user });
    } catch (err: any) {
        console.error("Google login error:", err.message);
        res.status(401).json({ message: "Google login failed" });
    }
});

// Google OAuth Redirect (state parameter - no query string in redirect_uri)
app.get("/api/auth/google/redirect", (req, res) => {
    const returnUrl = (req.query.returnUrl as string) || "/";
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${process.env.FRONTEND_URL}/auth/google/callback` +
        `&response_type=code` +
        `&scope=email%20profile` +
        `&access_type=offline` +
        `&state=${encodeURIComponent(returnUrl)}`;
    res.redirect(googleAuthUrl);
});

// Google OAuth Callback
app.get("/api/auth/google/callback", async (req, res) => {
    try {
        const { code, state } = req.query;
        console.log("Google callback received - code:", code ? "yes" : "no", "state:", state);

        const returnUrl = (state as string) || "/";

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`,
                grant_type: "authorization_code",
            }),
        });

        const tokens: any = await tokenResponse.json();
        console.log("Token response:", tokens.error || "success");

        if (tokens.error) {
            console.error("Token error:", tokens.error_description);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
        }

        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const userInfo = await userResponse.json();
        console.log("User info received for:", userInfo.email);

        const user = await googleLogin(userInfo.email, userInfo.name, userInfo.picture);
        const jwtToken = generateToken(user.id);

        res.setHeader('Set-Cookie', `token=${jwtToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
        res.redirect(`${process.env.FRONTEND_URL}${returnUrl}`);
    } catch (err: any) {
        console.error("Google callback error:", err.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
    }
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

// CHAT
app.use("/api/chat", async (req, res, next) => {
    const { default: chatRoutes } = await import("./routes/chatRoutes");
    chatRoutes(req, res, next);
});

// WISHLIST
app.use("/api/wishlist", async (req, res, next) => {
    await connectDB();
    const { requireAuth } = await import("./middleware/authMiddleware");
    const { default: wishlistRoutes } = await import("./routes/wishlistRoutes");
    requireAuth(req, res, () => wishlistRoutes(req, res, next));
});

// FEATURED
app.use("/api/featured", async (req, res, next) => {
    await connectDB();
    const { default: featuredRoutes } = await import("./routes/featuredRoutes");
    featuredRoutes(req, res, next);
});

// Local dev only
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => {
        ensureIndexes();
        app.listen(5000, () => console.log("http://localhost:5000"));
    });
}

export default app;