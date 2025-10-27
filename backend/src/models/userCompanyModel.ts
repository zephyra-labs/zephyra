import type { UserCompany, CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../types/UserCompany.js"
import { db } from "../config/firebase.js"

const collection = db.collection("userCompanies")

export class UserCompanyModel {
  // --- Create Relation ---
  static async create(data: CreateUserCompanyDTO): Promise<UserCompany> {
    const docRef = await collection.add({
      ...data,
      role: data.role ?? "staff",
      status: data.status ?? "pending",
      joinedAt: data.joinedAt ?? Date.now(),
    })
    return { id: docRef.id, ...data } as UserCompany
  }

  // --- Get All with optional filters ---
  static async getAllFiltered(params: {
    page: number
    limit: number
    search?: string
    role?: string
    status?: string
    companyId?: string
  }): Promise<{ data: UserCompany[]; total: number }> {
    const { page, limit, search, role, status, companyId } = params
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collection

    if (companyId) query = query.where("companyId", "==", companyId)
    if (role) query = query.where("role", "==", role)
    if (status) query = query.where("status", "==", status)

    if (search) {
      query = query
        .orderBy("userAddress")
        .where("userAddress", ">=", search)
        .where("userAddress", "<=", search + "\uf8ff")
    } else {
      query = query.orderBy("joinedAt", "desc")
    }

    const totalSnap = await query.get()
    const total = totalSnap.size

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get()
    const data: UserCompany[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[]

    return { data, total }
  }

  // --- Get By ID ---
  static async getById(id: string): Promise<UserCompany | null> {
    const doc = await collection.doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as UserCompany
  }

  // --- Get By User ---
  static async getByUser(userAddress: string): Promise<UserCompany[]> {
    const snapshot = await collection.where("userAddress", "==", userAddress).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[]
  }

  // --- Get By Company ---
  static async getByCompany(companyId: string): Promise<UserCompany[]> {
    const snapshot = await collection.where("companyId", "==", companyId).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserCompany[]
  }

  // --- Update ---
  static async update(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany | null> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return null

    const updateData: Partial<UserCompany> = { ...data, updatedAt: data.updatedAt ?? Date.now() }
    await docRef.update(updateData)
    const updatedDoc = await docRef.get()
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserCompany
  }

  // --- Delete ---
  static async delete(id: string): Promise<boolean> {
    const docRef = collection.doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) return false
    await docRef.delete()
    return true
  }
}
