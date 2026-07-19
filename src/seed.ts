import 'dotenv/config';
import { connectDB, ensureIndexes, getDb } from './db';

const destinations = [
    {
        name: 'Santorini, Greece',
        slug: 'santorini-greece',
        country: 'Greece',
        images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop'],
        shortDescription: 'Iconic blue-domed churches and breathtaking sunsets.',
        fullDescription: 'Santorini is a volcanic island in the Cyclades...',
        priceRange: { min: 800, max: 2500 },
        category: 'beach',
        rating: 4.8,
        bestTimeToVisit: 'June to September',
        tags: ['beach', 'romantic', 'luxury', 'island'],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Kyoto, Japan',
        slug: 'kyoto-japan',
        country: 'Japan',
        images: ['https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&h=400&fit=crop'],
        shortDescription: 'Ancient temples, cherry blossoms, and traditional tea houses.',
        fullDescription: 'Kyoto, once the capital of Japan...',
        priceRange: { min: 500, max: 1800 },
        category: 'city',
        rating: 4.9,
        bestTimeToVisit: 'March to May, October to November',
        tags: ['culture', 'history', 'temples', 'city'],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

(async () => {
    await connectDB();
    await ensureIndexes();
    const db = getDb();
    await db.collection('destinations').deleteMany({});
    await db.collection('destinations').insertMany(destinations);
    console.log(`✅ Seeded ${destinations.length} destinations.`);
    process.exit(0);
})();