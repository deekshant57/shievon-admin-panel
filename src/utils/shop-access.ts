import { User, Shop } from '@/types';
import {
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';

const LOG_PREFIX = '[shop-access]';

export type ShopAccessResult = {
  allowed: boolean;
  isAdmin: boolean;
  ownsShop: boolean;
  isManagedShop: boolean;
  isOwnerById: boolean;
  reason: string;
};

/**
 * Decide whether the current user may view a shop-scoped page.
 * Compares ids as strings to avoid number/string mismatches from the API.
 */
export function evaluateShopAccess(params: {
  me?: User | null;
  shopId?: string | number | null;
  shop?: Pick<Shop, 'id' | 'owner_id'> | null;
  permissions?: string[] | null;
  context?: string;
}): ShopAccessResult {
  const {
    me,
    shopId,
    shop,
    permissions = getAuthCredentials().permissions,
    context = 'shop',
  } = params;

  const isAdmin = hasAccess(adminOnly, permissions);
  const ownsShop =
    me?.shops?.some((s) => String(s.id) === String(shopId)) ?? false;
  const isManagedShop =
    me?.managed_shop?.id != null &&
    String(me.managed_shop.id) === String(shopId);
  const isOwnerById =
    shop?.owner_id != null &&
    me?.id != null &&
    String(shop.owner_id) === String(me.id);

  const allowed = isAdmin || ownsShop || isManagedShop || isOwnerById;

  let reason = 'allowed';
  if (!allowed) {
    if (!me) reason = 'me_not_loaded';
    else if (shopId == null || shopId === '') reason = 'shop_id_missing';
    else reason = 'not_owner_or_admin';
  }

  if (typeof window !== 'undefined') {
    // Helpful when diagnosing owner redirects (e.g. payouts → dashboard)
    // eslint-disable-next-line no-console
    console.info(LOG_PREFIX, context, {
      allowed,
      reason,
      isAdmin,
      ownsShop,
      isManagedShop,
      isOwnerById,
      shopId,
      shopIdType: shopId == null ? null : typeof shopId,
      meId: me?.id,
      meShopIds: me?.shops?.map((s) => ({ id: s.id, type: typeof s.id })),
      managedShopId: me?.managed_shop?.id,
      shopOwnerId: shop?.owner_id,
      permissions,
    });
  }

  return {
    allowed,
    isAdmin,
    ownsShop,
    isManagedShop,
    isOwnerById,
    reason,
  };
}
