import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function* generateItineraryStream(params: {
    destination: string;
    days: number;
    budget: number;
    interests: string[];
    length: string;
}) {
    const prompt = `Create a ${params.length} ${params.days}-day itinerary for ${params.destination}. Budget: $${params.budget}. Interests: ${params.interests.join(", ")}.`;

    const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        stream: true,
    });

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
    }
}