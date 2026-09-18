import {
  PaymentInfo,
  PaymentInfoVerificationStatus,
  VendorSettlementSummary,
} from '@/types';

const KNOWN_STATUSES: PaymentInfoVerificationStatus[] = [
  'verified',
  'pending',
  'failed',
  'unverified',
];

function normalizeStatus(
  raw: unknown,
): PaymentInfoVerificationStatus | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'boolean') {
    return raw ? 'verified' : 'unverified';
  }
  const normalized = String(raw).trim().toLowerCase();
  if ((KNOWN_STATUSES as string[]).includes(normalized)) {
    return normalized as PaymentInfoVerificationStatus;
  }
  return undefined;
}

type PaymentInfoLike = PaymentInfo & {
  is_verified?: boolean;
  verified?: boolean;
};

/**
 * Resolve bank verification from BE fields only (never invent "verified").
 * Prefers settlement payment_info, then shop balance payment_info.
 */
export function resolveBankVerificationStatus(params: {
  settlement?: VendorSettlementSummary | null;
  shopPaymentInfo?: PaymentInfo | null;
}): PaymentInfoVerificationStatus {
  const settlementPayment = params.settlement?.payment_info as
    | PaymentInfoLike
    | undefined;
  const shopPayment = params.shopPaymentInfo as PaymentInfoLike | undefined;

  const candidates: unknown[] = [
    settlementPayment?.verification_status,
    settlementPayment?.is_verified,
    settlementPayment?.verified,
    (params.settlement as { verification_status?: unknown } | undefined)
      ?.verification_status,
    shopPayment?.verification_status,
    shopPayment?.is_verified,
    shopPayment?.verified,
  ];

  for (const candidate of candidates) {
    const status = normalizeStatus(candidate);
    if (status) {
      return status;
    }
  }

  return 'unverified';
}
