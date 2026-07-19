import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function* generateItineraryStream(params: {
    destination: string;
    days: number;
    budget: number;
    interests: string[];
    length: string;
}) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.9 },
    });

    const prompt = `Create a ${params.length} day-by-day itinerary for a trip to ${params.destination}.
Duration: ${params.days} days
Budget: $${params.budget}
Interests: ${params.interests.join(", ")}
Output style: ${params.length === "detailed" ? "Detailed with activities, tips, and estimated costs" : "Concise overview with highlights"}.`;

    const stream = await model.generateContentStream(prompt);
    for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}