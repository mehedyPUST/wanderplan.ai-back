import OpenAI from 'openai';

const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function chatWithDeepSeek(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    userContext?: { name?: string; preferences?: any }
) {
    const systemPrompt = `You are a friendly and expert travel assistant for WanderPlan AI. 
Help users plan trips, recommend destinations, create itineraries, answer travel questions, and give practical tips.
${userContext ? `Current user: ${userContext.name}. Preferences: ${JSON.stringify(userContext.preferences)}` : ''}
Use a warm tone, occasional emojis, and keep answers concise and helpful.`;

    const stream = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
    });

    return stream;
}