import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function chatWithDeepSeek(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    userContext?: { name?: string; preferences?: any }
) {
    const systemPrompt = `You are a friendly and expert travel assistant for WanderPlan AI. 
Help users plan trips, recommend destinations, create itineraries, answer travel questions, and give practical tips.
${userContext ? `Current user: ${userContext.name}. Preferences: ${JSON.stringify(userContext.preferences)}` : ''}
Use a warm tone, occasional emojis, and keep answers concise and helpful.`;

    const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'system'),
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
    });

    return stream;
}