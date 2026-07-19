import { Router, Request, Response } from "express";
import { chatWithDeepSeek } from "../services/chatAssistant";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;
        if (!messages?.length) return res.status(400).json({ message: "Messages required" });

        const user = (req as any).user;

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        const stream = await chatWithDeepSeek(
            messages,
            user ? { name: user.name, preferences: user.preferences } : undefined
        );

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: "Chat failed" })}\n\n`);
        res.end();
    }
});

export default router;