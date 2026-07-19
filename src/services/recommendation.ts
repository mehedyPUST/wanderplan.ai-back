import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getRecommendations(
    userPreferences: { budget: number; interests: string[]; travelStyle: string },
    destinations: any[]
) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.7 },
    });

    const prompt = `
You are a travel recommendation expert. Based on these user preferences, recommend up to 5 destinations from the list.
User preferences: ${JSON.stringify(userPreferences)}
Available destinations: ${JSON.stringify(destinations.map((d: any) => ({
        name: d.name,
        category: d.category,
        priceRange: d.priceRange,
        tags: d.tags,
        rating: d.rating,
    })))}

Return ONLY a JSON array of objects with: name, reason, score (1-10). No markdown, no extra text.
Example: [{"name": "Santorini", "reason": "Perfect beach destination", "score": 9.5}]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
}