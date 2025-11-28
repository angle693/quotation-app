// src/types/index.ts
export interface Customer {
  name: string;
  mobile: string;
  address: string;
}

export interface ProductRow {
  id: string;
  thickness: string;
  size: string;
  quantity: number;
  totalSqFt: number;
  brandTotals: { [brand: string]: number };
}

export interface AdditionalItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Quotation {
  quotationNo: number;
  customer: Customer;
  selectedBrands: string[];
  brandAdjustments: { [brand: string]: number };
  products: ProductRow[];
  additionalItems: AdditionalItem[];
  createdAt: string | Date;
}

export type RateData = {
  [brand: string]: {
    '19MM': number;
    '12MM': number;
    '9MM': number;
    '6MM': number;
  };
};

export interface QuotationContextType {
  rates: RateData;
  updateRates: (rates: RateData) => void;
  quotations: Quotation[];
  addQuotation: (data: Omit<Quotation, 'quotationNo' | 'createdAt'>) => void;
  updateQuotation: (quotationNo: number, data: Omit<Quotation, 'quotationNo' | 'createdAt'>) => void;
  deleteQuotation: (quotationNo: number) => void; // 👈 Added
  getNextQuotationNo: () => number;
  loading: boolean;
}