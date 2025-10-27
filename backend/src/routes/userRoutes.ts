import { Router } from "express"
import {
  walletConnectHandler,
  getCurrentUserHandler,
  getAllUsersHandler,
  getUserHandler,
  updateUserHandler,
  updateMeHandler,
  deleteUserHandler,
} from "../controllers/UserController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router()

// --- Wallet Connect / Auto-register ---
router.post("/wallet-connect", walletConnectHandler)

// --- Get Current User ---
router.get("/me", authMiddleware, getCurrentUserHandler)

// --- Get All Users ---
router.get("/", authMiddleware, getAllUsersHandler)

// --- Get Single User ---
router.get("/:address", authMiddleware, getUserHandler)

// --- Update Current User ---
router.patch("/update/me", authMiddleware, updateMeHandler)

// --- Update User (Admin only) ---
router.patch("/:address", authMiddleware, adminMiddleware, updateUserHandler)

// --- Delete User (Admin only) ---
router.delete("/:address", authMiddleware, adminMiddleware, deleteUserHandler)

export default router
