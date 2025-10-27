import type { Request, Response } from 'express';
import { CompanyService } from '../services/companyService.js';

// POST /company (manual/admin)
export const createCompany = async (req: Request, res: Response) => {
  try {
    const { executor, ...data } = req.body;
    if (!executor) return res.status(400).json({ success: false, message: 'Executor is required' });

    const company = await CompanyService.createCompany(data, executor);
    res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /company
export const getCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await CompanyService.getAllCompanies();
    res.json({ success: true, data: companies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /company/:id
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await CompanyService.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /company/:id
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { executor, ...data } = req.body;
    if (!executor) return res.status(400).json({ success: false, message: 'Executor is required' });

    const updated = await CompanyService.updateCompany(req.params.id, data, executor);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /company/:id
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const executor = req.body.executor || req.headers['x-executor']?.toString();
    if (!executor) return res.status(400).json({ success: false, message: 'Executor is required' });

    await CompanyService.deleteCompany(req.params.id, executor);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
