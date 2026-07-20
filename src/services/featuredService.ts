import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function generateFeaturedDestinations() {
    const prompt = `You are a travel expert. Select 6 diverse destinations from around the world that are trending right now. Consider seasonality, popularity, and variety (different continents, beach/city/mountain).

Return ONLY a JSON array in this format:
[
  {
    "name": "City, Country",
    "slug": "city-country",
    "country": "Country",
    "image": "https://images.unsplash.com/photo-XXXXX?w=600&h=400&fit=crop",
    "shortDescription": "One sentence why it's trending",
    "priceRange": { "min": 500, "max": 2000 },
    "rating": 4.5,
    "category": "beach/city/mountain",
    "tags": ["tag1", "tag2"],
    "reason": "Why this destination is featured this week"
  }
]

Rules:
- Use REAL Unsplash image URLs (format: https://images.unsplash.com/photo-XXXXX?w=600&h=400&fit=crop)
- Prices must be realistic
- Ratings between 4.0 and 5.0
- Include destinations from at least 4 different countries
- No markdown, ONLY the JSON array`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
}