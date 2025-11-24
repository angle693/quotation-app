// backend/src/controllers/quotationController.ts
import { Request, Response } from 'express';
import { Quotation } from '../models/Quotation.js';

export const getAllQuotations = async (_req: Request, res: Response) => {
  try {
    const quotes = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const { customer, selectedBrands, products, additionalItems } = req.body;

    if (!customer?.name || !customer?.mobile || !selectedBrands?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const last = await Quotation.findOne().sort({ quotationNo: -1 });
    const nextNo = last ? last.quotationNo + 1 : 1001;

    const newQuotation = new Quotation({
      quotationNo: nextNo,
      customer,
      selectedBrands,
      brandAdjustments: {},
      products,
      additionalItems,
      createdAt: new Date(),
    });

    await newQuotation.save();
    res.status(201).json(newQuotation);
  } catch (err) {
    console.error('Create quotation error:', err);
    res.status(500).json({ message: 'Failed to create quotation' });
  }
};