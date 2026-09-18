const StatusColor = (status: string) => {
  const normalized = String(status ?? '')
    .toLowerCase()
    .replace(/^order-/, '')
    .replace(/^payment-/, '');

  let bg_class = '';
  if (normalized === 'pending') {
    bg_class = 'bg-status-pending bg-opacity-10 text-status-pending';
  } else if (normalized === 'processing') {
    bg_class = 'bg-status-processing bg-opacity-10 text-status-processing';
  } else if (
    normalized === 'completed' ||
    normalized === 'approved' ||
    normalized === 'success'
  ) {
    bg_class = 'bg-status-complete bg-opacity-10 text-status-complete';
  } else if (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'rejected' ||
    normalized === 'reversal'
  ) {
    bg_class = 'bg-status-canceled bg-opacity-10 text-status-canceled';
  } else if (normalized === 'failed') {
    bg_class = 'bg-status-failed bg-opacity-10 text-status-failed';
  } else if (
    normalized === 'at-local-facility' ||
    normalized === 'out-for-delivery'
  ) {
    bg_class =
      'bg-status-out-for-delivery bg-opacity-10 text-status-out-for-delivery';
  } else if (
    normalized === 'ready-for-pickup' ||
    normalized === 'ready-for-delivery'
  ) {
    bg_class = 'bg-accent bg-opacity-10 !text-accent';
  } else if (normalized === 'refunded') {
    bg_class = 'bg-rose-400 bg-opacity-10 text-status-pending';
  } else {
    bg_class = 'bg-accent bg-opacity-10 !text-accent';
  }

  return bg_class;
};

export default StatusColor;
