import { MongoClient, Db } from 'mongodb';
import { randomUUID } from 'crypto';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'flowsper';

// Document type that uses string _id instead of ObjectId
export type Doc = { _id?: string; [key: string]: any };

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Get the MongoDB database instance
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Get the MongoDB client instance
 */
export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Generate a new UUID for document IDs
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Convert a MongoDB document (_id) to a plain object with id field
 */
export function toDoc<T extends Record<string, any>>(doc: any): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as T;
}

/**
 * Convert an array of MongoDB documents to plain objects with id fields
 */
export function toDocs<T extends Record<string, any>>(docs: any[]): T[] {
  return docs.map(doc => toDoc<T>(doc)!);
}

export { clientPromise };
