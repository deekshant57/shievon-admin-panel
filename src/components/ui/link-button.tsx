import LinkActionButton from '@/components/ui/link-action-button';
import type { LinkActionButtonProps } from '@/components/ui/link-action-button';

export type ButtonProps = LinkActionButtonProps;

/**
 * @deprecated Use LinkActionButton from `@/components/ui/action-button` for new code.
 * Kept as an alias — all toolbar link buttons use Design B · Soft styles.
 */
const LinkButton = LinkActionButton;

export default LinkButton;
