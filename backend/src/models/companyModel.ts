/**
 * @file CompanyModel.ts
 * @description Firestore model for managing companies
 */

import { db } from '../config/firebase.js';
import type { Company } from '../types/Company.js';

/** Firestore collection reference for companies */
const collection = db.collection('companies');

/**
 * Firestore model for company CRUD operations
 */
export class CompanyModel {
  /**
   * Create a new company
   * @param data Partial company data
   * @returns The newly created company with generated ID
   */
  static async create(data: Partial<Company>): Promise<Company> {
    const docRef = await collection.add(data);
    return { id: docRef.id, ...data } as Company;
  }

  /**
   * Update an existing company
   * @param id Company document ID
   * @param data Partial company data to update
   * @returns Updated company or null if company not found
   */
  static async update(id: string, data: Partial<Company>): Promise<Company | null> {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as Company;
  }

  /**
   * Delete a company by ID
   * @param id Company document ID
   * @returns The deleted company or null if not found
   */
  static async delete(id: string): Promise<Company | null> {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.delete();
    return { id: doc.id, ...doc.data() } as Company;
  }

  /**
   * Get all companies
   * @returns Array of all companies
   */
  static async getAll(): Promise<Company[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
  }

  /**
   * Get a company by its ID
   * @param id Company document ID
   * @returns The company or null if not found
   */
  static async getById(id: string): Promise<Company | null> {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Company;
  }
}
