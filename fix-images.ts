import 'dotenv/config';
import { getDb } from './src/db';

(async () => {
    const db = await getDb();
    const img = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop';
    await db.collection('destinations').updateMany({}, { $set: { images: [img] } });
    console.log('✅ All destination images updated.');
    process.exit(0);
})();