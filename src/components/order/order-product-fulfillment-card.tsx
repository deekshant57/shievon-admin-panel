import { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import OrderFulfillmentPanel from '@/components/order/order-fulfillment-panel';
import Badge from '@/components/ui/badge/badge';
import Checkbox from '@/components/ui/checkbox/checkbox';
import { Table } from '@/components/ui/table';
import { NoDataFound } from '@/components/icons/no-data-found';
import { useIsRTL } from '@/utils/locals';
import { Order, ProductFulfillmentLine } from '@/types';
import {
  useConfirmProductPickupMutation,
  useMarkProductLinesReadyMutation,
  useUnableToFulfillProductLineMutation,
} from '@/data/order';
import {
  canConfirmPickupForOrder,
  canMarkLineReady,
  canMarkProductLinesReady,
  canUnableToFulfillProduct,
  getFulfillmentStatusBadgeColor,
  getFulfillmentStatusLabelKey,
  getProductFulfillmentDisplayLines,
  getProductLineDisplayStatus,
  getProductNameForLine,
  getRemainingPickupQty,
  isDeliveryOrder,
  isOrderOpenForFulfillmentActions,
} from '@/utils/order-fulfillment';
import UnableToFulfillModal from '@/components/order/unable-to-fulfill-modal';
import ConfirmPickupModal from '@/components/order/confirm-pickup-modal';

type OrderProductFulfillmentCardProps = {
  order: Order;
};

export default function OrderProductFulfillmentCard({
  order,
}: OrderProductFulfillmentCardProps) {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const lines = useMemo(
    () => getProductFulfillmentDisplayLines(order),
    [order],
  );
  const actionsEnabled = isOrderOpenForFulfillmentActions(order);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [unableTarget, setUnableTarget] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] =
    useState<ProductFulfillmentLine | null>(null);

  const { mutate: markReady, isLoading: markingReady } =
    useMarkProductLinesReadyMutation();
  const { mutate: confirmPickup, isLoading: confirmingPickup } =
    useConfirmProductPickupMutation();
  const { mutate: unableToFulfill, isLoading: markingUnable } =
    useUnableToFulfillProductLineMutation();

  const selectableLineIds = actionsEnabled
    ? lines.filter((line) => canMarkLineReady(order, line)).map((line) => line.id)
    : [];
  const allSelected =
    selectableLineIds.length > 0 &&
    selectableLineIds.every((id) => selectedIds.includes(id));

  function toggleLineSelection(lineId: string) {
    setSelectedIds((current) =>
      current.includes(lineId)
        ? current.filter((id) => id !== lineId)
        : [...current, lineId],
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : selectableLineIds);
  }

  function handleMarkAllReady() {
    markReady({ id: order.id });
    setSelectedIds([]);
  }

  function handleMarkSelectedReady() {
    if (!selectedIds.length) {
      return;
    }
    markReady({ id: order.id, order_item_ids: selectedIds });
    setSelectedIds([]);
  }

  function handleConfirmPickup(quantity?: number) {
    if (!confirmTarget) {
      return;
    }
    confirmPickup(
      {
        id: order.id,
        itemId: confirmTarget.id,
        quantity,
      },
      {
        onSuccess: () => setConfirmTarget(null),
      },
    );
  }

  function handleUnableToFulfill(reason: string) {
    if (!unableTarget) {
      return;
    }
    unableToFulfill(
      {
        id: order.id,
        itemId: unableTarget,
        reason,
      },
      {
        onSuccess: () => setUnableTarget(null),
      },
    );
  }

  const isDelivery = isDeliveryOrder(order);

  const columns = [
    ...(actionsEnabled
      ? [
          {
            title: (
              <Checkbox
                name="select-all-product-lines"
                checked={allSelected}
                disabled={!selectableLineIds.length}
                onChange={toggleSelectAll}
              />
            ),
            dataIndex: 'id',
            key: 'select',
            width: 48,
            render: (_id: string, line: ProductFulfillmentLine) => (
              <Checkbox
                name={`select-line-${line.id}`}
                checked={selectedIds.includes(line.id)}
                disabled={!canMarkLineReady(order, line)}
                onChange={() => toggleLineSelection(line.id)}
              />
            ),
          },
        ]
      : []),
    {
      title: t('table:table-item-products'),
      dataIndex: 'id',
      key: 'product',
      align: alignLeft,
      render: (lineId: string) => (
        <span className="font-medium text-heading">
          {getProductNameForLine(order, lineId)}
        </span>
      ),
    },
    ...(isDelivery
      ? []
      : [
          {
            title: t('table:table-item-picked-quantity'),
            dataIndex: 'quantity',
            key: 'quantity',
            align: alignRight,
            render: (_quantity: number, line: ProductFulfillmentLine) => (
              <span>
                {line.picked_up_quantity ?? 0} / {line.quantity ?? 0}
              </span>
            ),
          },
        ]),
    {
      title: t('table:table-item-fulfillment'),
      dataIndex: 'fulfillment_status',
      key: 'fulfillment_status',
      align: alignLeft,
      render: (_status: string | null | undefined, line: ProductFulfillmentLine) => {
        const displayStatus = getProductLineDisplayStatus(line);
        return (
          <Badge
            text={t(getFulfillmentStatusLabelKey(displayStatus))}
            color={getFulfillmentStatusBadgeColor(displayStatus)}
          />
        );
      },
    },
    ...(actionsEnabled
      ? [
          {
            title: t('table:table-item-actions'),
            dataIndex: 'id',
            key: 'actions',
            align: alignRight,
            render: (_id: string, line: ProductFulfillmentLine) => {
              const remainingQty = getRemainingPickupQty(line);

              return (
                <div className="flex flex-wrap justify-end gap-2">
                  {canConfirmPickupForOrder(order, line) ? (
                    <Button
                      size="small"
                      loading={
                        confirmingPickup && confirmTarget?.id === line.id
                      }
                      onClick={() => {
                        if (remainingQty > 1) {
                          setConfirmTarget(line);
                          return;
                        }
                        confirmPickup({
                          id: order.id,
                          itemId: line.id,
                        });
                      }}
                    >
                      {t('form:button-confirm-pickup')}
                    </Button>
                  ) : null}
                  {canUnableToFulfillProduct(order, line) ? (
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setUnableTarget(line.id)}
                    >
                      {t('form:button-unable-to-fulfill')}
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <OrderFulfillmentPanel
        title={
          isDelivery
            ? t('common:text-product-delivery-track')
            : t('common:text-product-pickup-track')
        }
        description={t('common:text-fulfillment-status')}
        meta={
          isDelivery && actionsEnabled ? (
            <p className="text-sm text-body">
              {t('common:text-delivery-vendor-action-hint')}
            </p>
          ) : undefined
        }
        toolbar={
          actionsEnabled ? (
            <>
              <Button
                size="small"
                loading={markingReady}
                disabled={!canMarkProductLinesReady(order)}
                onClick={handleMarkAllReady}
              >
                {t('form:button-mark-all-ready')}
              </Button>
              <Button
                size="small"
                variant="outline"
                loading={markingReady}
                disabled={
                  !selectedIds.length || !canMarkProductLinesReady(order)
                }
                onClick={handleMarkSelectedReady}
              >
                {t('form:button-mark-ready')}
              </Button>
            </>
          ) : undefined
        }
      >
        <Table
          shellVariant="plain"
          //@ts-ignore
          columns={columns}
          data={lines}
          rowKey="id"
          scroll={{ x: 700 }}
          emptyText={() => (
            <div className="flex flex-col items-center py-7">
              <NoDataFound className="w-52" />
              <div className="mb-1 pt-6 text-base font-semibold text-heading">
                {t('table:empty-table-data')}
              </div>
            </div>
          )}
        />
      </OrderFulfillmentPanel>

      <UnableToFulfillModal
        open={Boolean(unableTarget)}
        onClose={() => setUnableTarget(null)}
        onConfirm={handleUnableToFulfill}
        isLoading={markingUnable}
      />

      <ConfirmPickupModal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmPickup}
        maxQuantity={
          confirmTarget ? getRemainingPickupQty(confirmTarget) : 1
        }
        isLoading={confirmingPickup}
      />
    </>
  );
}
