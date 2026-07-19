import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in .env');
    process.exit(1);
}
if (!process.env.DB_NAME) {
    console.error('❌ Missing DB_NAME in .env');
    process.exit(1);
}

const uri = process.env.MONGODB_URI!;
const dbName = process.env.DB_NAME!;

const client = new MongoClient(uri);
let db: Db;

export async function connectDB(): Promise<Db> {
    if (db) return db;
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
}

export function getDb(): Db {
    if (!db) throw new Error('DB not connected. Call connectDB() first.');
    return db;
}

export async function ensureIndexes() {
    const d = getDb();
    try { await d.collection('users').createIndex({ email: 1 }, { unique: true, name: 'email_unique' }); } catch { }
    try { await d.collection('destinations').createIndex({ slug: 1 }, { unique: true, name: 'slug_unique' }); } catch { }
    try { await d.collection('destinations').createIndex({ category: 1, 'priceRange.min': 1, rating: -1 }, { name: 'category_price_rating' }); } catch { }
    try { await d.collection('destinations').createIndex({ name: 'text', shortDescription: 'text' }, { name: 'name_description_text' }); } catch { }
    try { await d.collection('destinations').createIndex({ tags: 1 }, { name: 'tags' }); } catch { }
    try { await d.collection('itineraries').createIndex({ userId: 1, createdAt: -1 }, { name: 'userId_created' }); } catch { }
    try { await d.collection('itineraries').createIndex({ destination: 1 }, { name: 'destination' }); } catch { }
    try { await d.collection('reviews').createIndex({ destinationId: 1, createdAt: -1 }, { name: 'destinationId_created' }); } catch { }
    try { await d.collection('reviews').createIndex({ userId: 1 }, { name: 'userId' }); } catch { }
    try { await d.collection('recommendation_logs').createIndex({ userId: 1, timestamp: -1 }, { name: 'userId_timestamp' }); } catch { }
    try { await d.collection('chat_sessions').createIndex({ userId: 1 }, { name: 'userId_chat' }); } catch { }
    console.log('✅ Indexes ensured.');
}