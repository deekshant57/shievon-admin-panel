import 'rc-table/assets/index.css';
import DataTableShell from '@/components/page/data-table-shell';
import { cn } from '@/lib/utils';
import RcTable, { type TableProps as RcTableProps } from 'rc-table';
import { forwardRef } from 'react';

export type AlignType = 'left' | 'center' | 'right';

export type TableProps = RcTableProps & {
  /** Extra classes on the scroll shell (list pages). */
  shellClassName?: string;
  /** `bordered` = list tables; `plain` = scroll only, no extra chrome. */
  shellVariant?: 'bordered' | 'plain';
  /** Skip the shell for tightly nested tables (e.g. dashboard widgets). */
  disableShell?: boolean;
};

/**
 * Do not force horizontal scroll by default — progressive-column lists should fit.
 * Numeric scroll.x (legacy list props) maps to max-content so overflow stays in DataTableShell.
 * Pass scroll explicitly only when a dense table intentionally needs in-table scroll.
 */
function normalizeScroll(scroll?: RcTableProps['scroll']): RcTableProps['scroll'] {
  if (!scroll || scroll.x === undefined) {
    return scroll;
  }
  if (typeof scroll.x === 'number') {
    return { ...scroll, x: 'max-content' };
  }
  return scroll;
}

const Table = forwardRef<HTMLDivElement, TableProps>(function Table(
  {
    shellClassName,
    shellVariant = 'bordered',
    disableShell = false,
    scroll,
    className,
    ...props
  },
  ref,
) {
  const table = (
    <RcTable
      ref={ref}
      scroll={normalizeScroll(scroll)}
      className={className}
      {...props}
    />
  );

  if (disableShell) {
    return table;
  }

  return (
    <DataTableShell
      variant={shellVariant}
      className={cn(shellVariant === 'bordered' && 'mb-6', shellClassName)}
    >
      {table}
    </DataTableShell>
  );
});

export default Table;
export { Table };
