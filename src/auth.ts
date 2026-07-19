import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me';

export async function registerUser(email: string, password: string, name: string) {
    const db = getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
        email,
        password: hashedPassword,
        name,
        provider: 'credentials',
        preferences: { budget: 1000, interests: [], travelStyle: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await db.collection('users').insertOne(user);
    return { id: result.insertedId.toString(), email: user.email, name: user.name };
}

export async function loginUser(email: string, password: string) {
    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}

export function verifyToken(token: string): { id: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
        return null;
    }
}

export async function getUserFromToken(token: string) {
    const payload = verifyToken(token);
    if (!payload) return null;
    const db = getDb();
    const user = await db.collection('users').findOne(
        { _id: new ObjectId(payload.id) },
        { projection: { password: 0 } }
    );
    return user;
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
}