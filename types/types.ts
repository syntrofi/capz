export interface Wallet {
  id: string;
  name: string;
  targetIncome: number;
  timeFrame: string;
  accountAddress: string;
  withdrawalAddress: string;
  redistributionStrategy: string;
  balance: number;
  stakeholder: string;
}
