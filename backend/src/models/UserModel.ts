import type { User } from "../types/User.js";
import { db } from "../config/firebase.js";

const collection = db.collection("users");

export class UserModel {
  static async create(user: User): Promise<User> {
    const docRef = collection.doc(user.address);
    const doc = await docRef.get();
    if (doc.exists) throw new Error(`User with address ${user.address} already exists`);

    await docRef.set(user);
    return user;
  }

  static async getAll(): Promise<User[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  static async getByAddress(address: string): Promise<User | null> {
    const doc = await collection.doc(address).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  static async update(address: string, data: Partial<User>): Promise<User | null> {
    const docRef = collection.doc(address);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as User;
  }

  static async delete(address: string): Promise<boolean> {
    const docRef = collection.doc(address);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return false;

    await docRef.delete();
    return true;
  }
}
