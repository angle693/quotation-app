// backend/src/models/Quotation.ts
import { Schema, model, Document } from 'mongoose';

export interface IQuotation extends Document {
  quotationNo: number;
  customer: { name: string; mobile: string; address?: string };
  selectedBrands: string[];
  brandAdjustments: { [key: string]: number };
  products: any[];
  additionalItems: any[];
  createdAt: Date;
}

const QuotationSchema = new Schema<IQuotation>({
  quotationNo: { type: Number, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: false },
  },
  selectedBrands: { type: [String], required: true },
  brandAdjustments: { type: Object, required: true },
  products: { type: Array, required: true },
  additionalItems: { type: Array, required: true },
  createdAt: { type: Date, required: true },
});

export const Quotation = model<IQuotation>('Quotation', QuotationSchema);