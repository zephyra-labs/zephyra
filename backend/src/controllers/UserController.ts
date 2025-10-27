import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { UserService } from "../services/userService.js";

// --- Wallet Connect / Auto-register ---
export async function walletConnectHandler(req: Request, res: Response) {
  try {
    const { user, token } = await UserService.walletConnect(req.body);
    res.json({ success: true, data: user, token });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// --- Get current user ---
export async function getCurrentUserHandler(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'User not authenticated' });

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// --- Get All Users (Admin Only) ---
export async function getAllUsersHandler(_req: Request, res: Response) {
  try {
    const users = await UserService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// --- Get Single User ---
export async function getUserHandler(req: Request, res: Response) {
  try {
    const user = await UserService.getUser(req.params.address);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// --- Update User Role / Metadata ---
export async function updateUserHandler(req: Request, res: Response) {
  try {
    const updated = await UserService.updateUser(req.params.address, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// --- Update current user's own profile ---
export async function updateMeHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const updated = await UserService.updateUser(req.user.address, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// --- Delete User ---
export async function deleteUserHandler(req: Request, res: Response) {
  try {
    const deleted = await UserService.deleteUser(req.params.address);
    if (!deleted) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
