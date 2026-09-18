import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { format } from 'date-fns';
import Badge from '@/components/ui/badge/badge';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import OrderFulfillmentPanel from '@/components/order/order-fulfillment-panel';
import OrderDeliveryMap from '@/components/order/order-delivery-map';
import { useShopQuery } from '@/data/shop';
import { Order, Shop } from '@/types';
import usePrice from '@/utils/use-price';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import {
  formatDistanceKm,
  getShopCoordinates,
  haversineDistanceKm,
} from '@/utils/geo';
import { useOrderDeliveryPolling } from '@/utils/use-order-delivery-polling';
import {
  getPrimaryDelivery,
  getShipmentStatusBadgeColor,
  getShipmentStatusLabelKey,
  isDeliveryCancelled,
  isDeliveryFailed,
  isDeliveryOrder,
  shouldPollDeliveryTracking,
  shouldShowVendorPickupTracking,
} from '@/utils/order-fulfillment';

type OrderDeliveryPanelProps = {
  order: Order;
  shop?: Shop | null;
  refetchOrder?: () => void;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return format(new Date(value), 'MMMM d, yyyy h:mm a');
  } catch {
    return value;
  }
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-semibold text-heading">{label}</span>
      <div className="text-sm text-body sm:text-end">{children}</div>
    </div>
  );
}

export default function OrderDeliveryPanel({
  order,
  shop,
  refetchOrder,
}: OrderDeliveryPanelProps) {
  const { t } = useTranslation();
  const { query } = useRouter();
  const [showLiveMap, setShowLiveMap] = useState(true);
  const delivery = getPrimaryDelivery(order);
  const { price: deliveryFee } = usePrice({
    amount: order.delivery_fee ?? delivery?.estimated_fare ?? 0,
  });
  const riderPhone = useFormatPhoneNumber({
    customer_contact: delivery?.pilot?.phone,
  });

  const shopSlug =
    (typeof query.shop === 'string' ? query.shop : '') ||
    shop?.slug ||
    order.shop?.slug ||
    '';
  const { data: shopFromRoute } = useShopQuery(
    { slug: shopSlug },
    { enabled: Boolean(shopSlug) },
  );
  const shopCoords =
    getShopCoordinates(shop) ??
    getShopCoordinates(shopFromRoute) ??
    getShopCoordinates(order.shop);

  // Poll shipment/rider status while in flight, even if the live map is closed.
  useOrderDeliveryPolling(
    order,
    refetchOrder ?? (() => undefined),
    Boolean(refetchOrder) && shouldPollDeliveryTracking(delivery),
  );

  if (!isDeliveryOrder(order) || !delivery) {
    return null;
  }

  const shipmentStatus = delivery.shipment_status;
  const dispatchAt = formatDateTime(delivery.dispatch_at);
  const cancelled = isDeliveryCancelled(order);
  const failed = isDeliveryFailed(order);
  const showDispatchNotice =
    shipmentStatus === 'pending_dispatch' && !cancelled && !failed;
  const showPickupTracking =
    shouldShowVendorPickupTracking(delivery) && !cancelled;
  const riderDistanceFromShopKm =
    showPickupTracking &&
    shopCoords &&
    delivery.pilot_location
      ? haversineDistanceKm(
          shopCoords.lat,
          shopCoords.lng,
          delivery.pilot_location.latitude,
          delivery.pilot_location.longitude,
        )
      : null;

  const panelDescription = cancelled
    ? t('common:text-delivery-tracking-cancelled-description')
    : failed
      ? t('common:text-delivery-tracking-failed-description')
      : t('common:text-delivery-tracking-description');

  return (
    <OrderFulfillmentPanel
      title={t('common:text-delivery-tracking')}
      description={panelDescription}
      meta={
        <Badge
          text={t('common:text-delivery-order')}
          color="bg-blue-100 text-blue-800"
        />
      }
    >
      <div className="space-y-5">
        {cancelled ? (
          <Alert
            variant="info"
            message={t('common:text-order-cancelled-delivery')}
          />
        ) : null}

        {failed ? (
          <Alert
            variant="error"
            message={t('common:text-delivery-failed-contact-support')}
          />
        ) : null}

        {showDispatchNotice ? (
          <Alert
            variant="info"
            message={t('common:text-delivery-dispatch-delay')}
          />
        ) : null}

        <div className="grid gap-4 rounded-lg border border-border-200 bg-light p-4 md:grid-cols-2">
          <DetailRow label={t('common:text-shipment-status')}>
            <Badge
              text={t(getShipmentStatusLabelKey(shipmentStatus))}
              color={getShipmentStatusBadgeColor(shipmentStatus)}
            />
          </DetailRow>

          {order.customer_status_label ? (
            <DetailRow label={t('common:text-customer-status')}>
              {order.customer_status_label}
            </DetailRow>
          ) : null}

          <DetailRow label={t('common:order-delivery-fee')}>{deliveryFee}</DetailRow>

          {delivery.distance_km != null ? (
            <DetailRow label={t('common:text-delivery-distance')}>
              {delivery.distance_km.toFixed(1)} km
            </DetailRow>
          ) : null}

          {delivery.estimated_duration_min != null ? (
            <DetailRow label={t('common:text-delivery-eta')}>
              ~{delivery.estimated_duration_min} {t('common:text-minutes')}
            </DetailRow>
          ) : null}

          {dispatchAt && !cancelled && !failed ? (
            <DetailRow label={t('common:text-dispatch-at')}>{dispatchAt}</DetailRow>
          ) : null}

          {delivery.attempt_count != null && delivery.attempt_count > 0 ? (
            <DetailRow label={t('common:text-delivery-attempts')}>
              {delivery.attempt_count}
            </DetailRow>
          ) : null}

          {delivery.external_order_id ? (
            <DetailRow label={t('common:text-external-order-id')}>
              <span className="font-mono text-xs">{delivery.external_order_id}</span>
            </DetailRow>
          ) : null}
        </div>

        {delivery.pilot && !cancelled ? (
          <div className="rounded-lg border border-border-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-heading">
              {t('common:text-rider-details')}
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="block text-xs text-body">
                  {t('common:text-rider-name')}
                </span>
                <span className="font-medium text-heading">
                  {delivery.pilot.name}
                </span>
              </div>
              <div>
                <span className="block text-xs text-body">
                  {t('common:text-rider-phone')}
                </span>
                {delivery.pilot.phone ? (
                  <a
                    href={`tel:${(riderPhone || delivery.pilot.phone).replace(/\s+/g, '')}`}
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    {riderPhone || delivery.pilot.phone}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div>
                <span className="block text-xs text-body">
                  {t('common:text-vehicle-number')}
                </span>
                <span className="font-medium text-heading">
                  {delivery.vehicle_number || '—'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {showPickupTracking ? (
          <div className="rounded-lg border border-border-200 p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-heading">
                  {t('common:text-rider-heading-to-shop')}
                </h4>
                <p className="mt-1 text-xs text-body">
                  {t('common:text-live-pickup-map-hint')}
                </p>
              </div>
              <Button
                size="small"
                variant={showLiveMap ? 'outline' : 'normal'}
                onClick={() => setShowLiveMap((current) => !current)}
              >
                {showLiveMap
                  ? t('common:text-hide-live-map')
                  : t('common:text-show-live-map')}
              </Button>
            </div>
            {riderDistanceFromShopKm != null ? (
              <div className="mb-3 rounded-md bg-gray-50 px-3 py-2 text-sm">
                <span className="text-body">
                  {t('common:text-rider-distance-from-shop')}:{' '}
                </span>
                <span className="font-semibold text-heading">
                  {formatDistanceKm(riderDistanceFromShopKm)}
                </span>
              </div>
            ) : null}
            {showLiveMap && delivery.pilot_location ? (
              <OrderDeliveryMap
                pilotLocation={delivery.pilot_location}
                shopLocation={shopCoords}
                riderName={delivery.pilot?.name}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </OrderFulfillmentPanel>
  );
}

