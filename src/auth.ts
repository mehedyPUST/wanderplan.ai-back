import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { ObjectId } from 'mongodb';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email/Password Registration
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

// Email/Password Login
export async function loginUser(email: string, password: string) {
    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}

// Verify JWT Token
export function verifyToken(token: string): { id: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
        return null;
    }
}

// Get User from Token
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

// Change Password
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

// Verify Google Token
export async function verifyGoogleToken(token: string) {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
}

// Google Login / Auto-Register
export async function googleLogin(email: string, name: string, avatar?: string) {
    const db = getDb();
    let user = await db.collection('users').findOne({ email });

    if (!user) {
        const newUser = {
            email,
            name,
            avatar,
            provider: 'google',
            preferences: { budget: 1000, interests: [], travelStyle: '' },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection('users').insertOne(newUser);
        return { id: result.insertedId.toString(), email: newUser.email, name: newUser.name, avatar: newUser.avatar };
    }

    if (avatar && user.avatar !== avatar) {
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { avatar, updatedAt: new Date() } }
        );
    }

    return { id: user._id.toString(), email: user.email, name: user.name, avatar: avatar || user.avatar };
}

// Generate JWT Token
export function generateToken(userId: string) {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}