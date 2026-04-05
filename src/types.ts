export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  vatNumber: string;
  address: string;
  logo?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g., 22 for 22%
}

export interface Payment {
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  payments: Payment[];
  status: 'draft' | 'sent' | 'accepted' | 'cancelled' | 'paid';
  workDescription?: string;
  notes?: string;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
}
