/**
 * @file UserCompanyModel.ts
 * @description Firestore model for managing User-Company relationships with CRUD and query methods.
 */

import type { UserCompany, CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany";
import { db } from "../config/firebase";

const collection = db.collection("userCompanies");

/**
 * Model class for UserCompany Firestore operations.
 */
export class UserCompanyModel {
  /**
   * Create a new user-company relation
   * @param {CreateUserCompanyDTO} data Payload for creating a relation
   * @returns {Promise<UserCompany>} The newly created UserCompany record with generated ID
   */
  static async create(data: CreateUserCompanyDTO): Promise<UserCompany> {
    const newItem: UserCompany = {
      id: "",
      userAddress: data.userAddress,
      companyId: data.companyId,
      joinedAt: data.joinedAt ?? Date.now(),
      role: data.role ?? "staff",
      status: data.status ?? "pending",
    };

    const docRef = await collection.add(newItem);
    newItem.id = docRef.id;
    return newItem;
  }

  /**
   * Get all UserCompany records with optional filters and pagination
   * @param {Object} params Filter and pagination parameters
   * @param {number} params.page Page number (1-based)
   * @param {number} params.limit Items per page
   * @param {string} [params.search] Partial match for userAddress
   * @param {string} [params.role] Filter by role
   * @param {string} [params.status] Filter by status
   * @param {string} [params.companyId] Filter by company ID
   * @returns {Promise<{data: UserCompany[], total: number}>} List of records and total count
   */
  static async getAllFiltered(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
    companyId?: string;
  }): Promise<{ data: UserCompany[]; total: number }> {
    const { page, limit, search, role, status, companyId } = params;
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collection;

    if (companyId) query = query.where("companyId", "==", companyId);
    if (role) query = query.where("role", "==", role);
    if (status) query = query.where("status", "==", status);

    if (search) {
      query = query
        .orderBy("userAddress")
        .where("userAddress", ">=", search)
        .where("userAddress", "<=", search + "\uf8ff");
    } else {
      query = query.orderBy("joinedAt", "desc");
    }

    const totalSnap = await query.get();
    const total = totalSnap.size;

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data: UserCompany[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[];

    return { data, total };
  }

  /**
   * Get a UserCompany record by its Firestore ID
   * @param {string} id Document ID
   * @returns {Promise<UserCompany | null>} The record or null if not found
   */
  static async getById(id: string): Promise<UserCompany | null> {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as UserCompany;
  }

  /**
   * Get all UserCompany records for a specific user
   * @param {string} userAddress Wallet address of the user
   * @returns {Promise<UserCompany[]>} List of UserCompany records
   */
  static async getByUser(userAddress: string): Promise<UserCompany[]> {
    const snapshot = await collection.where("userAddress", "==", userAddress).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[];
  }

  /**
   * Get all UserCompany records for a specific company
   * @param {string} companyId Company ID
   * @returns {Promise<UserCompany[]>} List of UserCompany records
   */
  static async getByCompany(companyId: string): Promise<UserCompany[]> {
    const snapshot = await collection.where("companyId", "==", companyId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[];
  }

  /**
   * Update a UserCompany record by ID
   * @param {string} id Document ID
   * @param {UpdateUserCompanyDTO} data Fields to update
   * @returns {Promise<UserCompany | null>} Updated record or null if not found
   */
  static async update(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany | null> {
    const docRef = collection.doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;

    const updateData: Partial<UserCompany> = { ...data, updatedAt: data.updatedAt ?? Date.now() };
    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserCompany;
  }

  /**
   * Delete a UserCompany record by ID
   * @param {string} id Document ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id: string): Promise<boolean> {
    const docRef = collection.doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return false;
    await docRef.delete();
    return true;
  }
}
