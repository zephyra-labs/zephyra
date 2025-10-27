import { db } from '../config/firebase.js';
import type { Company } from '../types/Company.js';

const collection = db.collection('companies');

export class CompanyModel {
  static async create(data: Partial<Company>): Promise<Company> {
    const docRef = await collection.add(data);
    return { id: docRef.id, ...data } as Company;
  }

  static async update(id: string, data: Partial<Company>): Promise<Company | null> {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as Company;
  }

  static async delete(id: string): Promise<Company | null> {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.delete();
    return { ...doc.data(), id: doc.id } as Company;
  }

  static async getAll(): Promise<Company[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
  }

  static async getById(id: string): Promise<Company | null> {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Company;
  }
}
