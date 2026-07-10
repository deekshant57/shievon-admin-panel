import ActionButton from '@/components/ui/action-button';
import Checkbox from '@/components/ui/checkbox/checkbox';
import { cn } from '@/lib/utils';
import { Popover, Transition } from '@headlessui/react';
import { useTranslation } from 'next-i18next';
import { Fragment, useCallback, useMemo, useState } from 'react';

export type ProgressiveColumnOption = {
  key: string;
  label: string;
};

type ColumnLike = {
  key?: string;
};

type UseProgressiveColumnsArgs<T extends ColumnLike> = {
  columns: T[];
  primaryKeys: string[];
  secondaryOptions: ProgressiveColumnOption[];
};

/**
 * Progressive columns: primary keys always visible; secondary keys opt-in via Columns control.
 * Keeps list tables within the sidebar content width by default without clipping data.
 */
export function useProgressiveColumns<T extends ColumnLike>({
  columns,
  primaryKeys,
  secondaryOptions,
}: UseProgressiveColumnsArgs<T>) {
  const [visibleSecondaryKeys, setVisibleSecondaryKeys] = useState<string[]>(
    [],
  );

  const secondaryKeySet = useMemo(
    () => new Set(secondaryOptions.map((option) => option.key)),
    [secondaryOptions],
  );

  const visibleColumns = useMemo(() => {
    const allowed = new Set<string>([
      ...primaryKeys,
      ...visibleSecondaryKeys.filter((key) => secondaryKeySet.has(key)),
    ]);
    return columns.filter((column) => {
      if (!column.key) return true;
      // Primary + enabled secondary only; unknown keys stay (safety)
      if (primaryKeys.includes(column.key)) return true;
      if (secondaryKeySet.has(column.key)) {
        return allowed.has(column.key);
      }
      return true;
    });
  }, [columns, primaryKeys, secondaryKeySet, visibleSecondaryKeys]);

  const toggleSecondary = useCallback((key: string) => {
    setVisibleSecondaryKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }, []);

  const showAllSecondary = useCallback(() => {
    setVisibleSecondaryKeys(secondaryOptions.map((option) => option.key));
  }, [secondaryOptions]);

  const resetSecondary = useCallback(() => {
    setVisibleSecondaryKeys([]);
  }, []);

  return {
    visibleColumns,
    visibleSecondaryKeys,
    secondaryOptions,
    toggleSecondary,
    showAllSecondary,
    resetSecondary,
  };
}

type ProgressiveColumnsControlProps = {
  options: ProgressiveColumnOption[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onReset: () => void;
  className?: string;
};

export function ProgressiveColumnsControl({
  options,
  visibleKeys,
  onToggle,
  onShowAll,
  onReset,
  className,
}: ProgressiveColumnsControlProps) {
  const { t } = useTranslation();

  if (!options.length) {
    return null;
  }

  const activeCount = visibleKeys.length;

  return (
    <div className={cn('flex justify-end', className)}>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              as={ActionButton}
              variant="secondary"
              size="sm"
              className={cn(open && 'border-accent text-accent')}
            >
              {t('common:text-columns')}
              {activeCount > 0 ? (
                <span className="ms-1.5 text-muted-foreground">
                  +{activeCount}
                </span>
              ) : null}
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute end-0 z-20 mt-2 w-64 rounded-lg border border-border/60 bg-card p-3 shadow-md">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('common:text-optional-columns')}
                </p>
                <div className="space-y-2">
                  {options.map((option) => (
                    <Checkbox
                      key={option.key}
                      name={`progressive-col-${option.key}`}
                      label={option.label}
                      checked={visibleKeys.includes(option.key)}
                      onChange={() => onToggle(option.key)}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-heading"
                    onClick={onReset}
                  >
                    {t('common:text-default-columns')}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-accent hover:text-accent-hover"
                    onClick={onShowAll}
                  >
                    {t('common:text-show-all-columns')}
                  </button>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
