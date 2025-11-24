import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RateData, Quotation, QuotationContextType } from '../types';

const API_BASE_URL = '/api';

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const QuotationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rates, setRates] = useState<RateData>({
    'Duraflame Semiwaterproof 303': { '19MM': 67, '12MM': 50, '9MM': 42, '6MM': 32 },
    'Durbi Semiwaterproof 303': { '19MM': 77, '12MM': 56, '9MM': 46.5, '6MM': 35 },
    'Nocte Semiwaterproof 303': { '19MM': 80, '12MM': 59, '9MM': 49.5, '6MM': 38.5 },
    'Nocte Waterproof 710': { '19MM': 95, '12MM': 66, '9MM': 56, '6MM': 46 },
  });
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratesRes, quotesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/rates`),
          fetch(`${API_BASE_URL}/quotations`)
        ]);
        if (ratesRes.ok) {
          const data = await ratesRes.json();
          if (Object.keys(data).length > 0) setRates(data);
        }
        if (quotesRes.ok) {
          setQuotations(await quotesRes.json());
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addQuotation = async (data: Omit<Quotation, 'quotationNo' | 'createdAt'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      const newQuotation = await res.json();
      setQuotations(prev => [...prev, newQuotation]);
    } catch (err) {
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };

  const updateQuotation = (quotationNo: number, data: Omit<Quotation, 'quotationNo' | 'createdAt'>) => {
    addQuotation(data);
  };

  const updateRates = (newRates: RateData) => setRates(newRates);
  const getNextQuotationNo = () => quotations.length ? Math.max(...quotations.map(q => q.quotationNo)) + 1 : 1001;

  return (
    <QuotationContext.Provider value={{
      rates, updateRates, quotations, addQuotation, updateQuotation, getNextQuotationNo, loading
    }}>
      {children}
    </QuotationContext.Provider>
  );
};

export const useQuotation = () => {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error('useQuotation must be used within QuotationProvider');
  return ctx;
};