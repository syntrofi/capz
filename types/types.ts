export interface Wallet {
  id: string;
  name: string;
  targetIncome: number;
  timeFrame: string;
  address: string;
  redistributionStrategy: string;
  balance: number;
}
