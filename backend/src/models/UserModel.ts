/**
 * @file UserModel.ts
 * @description Firestore model for managing User entities.
 */

import type { User } from "../types/User.js";
import { db } from "../config/firebase.js";

/** Firestore collection reference for users */
const collection = db.collection("users");

/**
 * Model class for performing CRUD operations on the `users` collection.
 * @class
 */
export class UserModel {
  /**
   * Create a new user document in Firestore.
   * @async
   * @param {User} user - The user data to create.
   * @returns {Promise<User>} The created user document.
   * @throws {Error} If a user with the same address already exists.
   */
  static async create(user: User): Promise<User> {
    const docRef = collection.doc(user.address);
    const doc = await docRef.get();
    if (doc.exists) throw new Error(`User with address ${user.address} already exists`);

    await docRef.set(user);
    return user;
  }

  /**
   * Retrieve all users from Firestore.
   * @async
   * @returns {Promise<User[]>} Array of all user documents.
   */
  static async getAll(): Promise<User[]> {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  /**
   * Retrieve a single user by their wallet address.
   * @async
   * @param {string} address - The wallet address of the user.
   * @returns {Promise<User | null>} The user document if found, otherwise `null`.
   */
  static async getByAddress(address: string): Promise<User | null> {
    const doc = await collection.doc(address).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  /**
   * Update a user's data in Firestore.
   * @async
   * @param {string} address - The wallet address of the user to update.
   * @param {Partial<User>} data - Partial user fields to update.
   * @returns {Promise<User | null>} The updated user document, or `null` if not found.
   */
  static async update(address: string, data: Partial<User>): Promise<User | null> {
    const docRef = collection.doc(address);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;

    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as User;
  }

  /**
   * Delete a user from Firestore.
   * @async
   * @param {string} address - The wallet address of the user to delete.
   * @returns {Promise<boolean>} `true` if deletion was successful, otherwise `false`.
   */
  static async delete(address: string): Promise<boolean> {
    const docRef = collection.doc(address);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return false;

    await docRef.delete();
    return true;
  }
}
