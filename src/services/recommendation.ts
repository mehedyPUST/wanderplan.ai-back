import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function getRecommendations(
    userPreferences: { budget: number; interests: string[]; travelStyle: string; country?: string; city?: string }
) {
    const locationContext = userPreferences.country
        ? `in ${userPreferences.city ? userPreferences.city + ", " : ""}${userPreferences.country}`
        : "anywhere in the world";

    const prompt = `You are a world-class travel expert with deep knowledge of every country and city on Earth.

A traveler wants destination recommendations ${locationContext}.

Traveler Preferences:
- Budget: $${userPreferences.budget}
- Interests: ${userPreferences.interests.join(", ")}
- Travel Style: ${userPreferences.travelStyle}

Recommend exactly 5 REAL destinations that match these preferences. You must recommend actual, well-known destinations from around the world.

Return ONLY a JSON array in this exact format:
[
  {
    "name": "City, Country",
    "country": "Country Name",
    "matchScore": 9.5,
    "reason": "Detailed 2-3 sentence explanation of why this matches their preferences",
    "budgetFit": "Specific comment about budget (e.g., 'Well within your budget with average daily cost of $150')",
    "bestTime": "Best months to visit",
    "highlights": ["Specific attraction 1", "Specific attraction 2", "Specific attraction 3"],
    "tips": "One practical travel tip (visa, local custom, transport, etc.)"
  }
]

Rules:
- Each destination MUST be a real place
- Match scores should vary (not all the same)
- Budget recommendations must be realistic
- Highlights must be specific, named attractions
- Include diverse destinations (not all from the same region)
- No markdown, no extra text, ONLY the JSON array`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
}