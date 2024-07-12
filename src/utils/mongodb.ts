import { Collection, MongoClient } from "mongodb";

export const connection = async (collection: string): Promise<Collection> => {
    const client = new MongoClient(process.env.MONGODB_URI ?? '');
    const db = client.db(process.env.MONGODB_DB).collection(collection);
    await client.connect();
    return db;
}