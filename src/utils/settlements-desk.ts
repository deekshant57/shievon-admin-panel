import { SettlementBlockReason } from '@/types';

export const MIN_PAYOUT_AMOUNT = 500;

export function blockReasonLabel(reason?: SettlementBlockReason | null): string {
  switch (reason) {
    case 'BELOW_MINIMUM':
      return `Below minimum (₹${MIN_PAYOUT_AMOUNT})`;
    case 'BANK_INCOMPLETE':
      return 'Bank details incomplete';
    case 'BANK_UNVERIFIED':
      return 'Bank not verified';
    case 'ALREADY_QUEUED':
      return 'Payout already queued';
    case 'ON_HOLD':
      return 'Settlement on hold';
    case 'NO_PENDING':
      return 'No pending balance';
    default:
      return 'Cannot queue';
  }
}
