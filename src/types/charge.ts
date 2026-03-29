export interface ChargeRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ChargeInput {
  amount: number;
  currency: string;
  customerId: string;
  metadata?: Record<string, unknown>;
}