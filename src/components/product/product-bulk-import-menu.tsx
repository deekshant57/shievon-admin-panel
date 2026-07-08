import { ChevronDown } from '@/components/icons/chevronDownIcon';
import Link from '@/components/ui/link';
import { actionButtonVariants } from '@/components/ui/action-button-variants';
import { PRODUCT_IMPORTS } from '@/config/product-imports';
import { Menu, Transition } from '@headlessui/react';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { Fragment } from 'react';

type ProductBulkImportMenuProps = {
  shop: string;
  variant?: 'button' | 'pill' | 'inline' | 'soft';
  className?: string;
  fullWidth?: boolean;
};

export default function ProductBulkImportMenu({
  shop,
  variant = 'button',
  className,
  fullWidth = false,
}: ProductBulkImportMenuProps) {
  const { t } = useTranslation('common');

  const menuButtonClassName = cn(
    'inline-flex items-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
    {
      'h-12 flex-shrink-0 justify-center rounded-full border border-solid border-accent bg-accent px-5 text-[15px] leading-none text-white hover:border-transparent hover:bg-accent-hover lg:text-base':
        variant === 'button',
      'rounded-full bg-accent px-[0.625rem] py-[0.5625rem] text-xs text-white hover:bg-accent-hover':
        variant === 'pill',
      'text-sm font-semibold text-accent hover:text-accent-hover':
        variant === 'inline',
      [actionButtonVariants({ variant: 'secondary', size: 'sm' })]:
        variant === 'soft',
    },
    fullWidth && 'w-full justify-center',
    variant === 'soft' && 'w-full justify-center sm:w-auto',
  );

  const menuItemsClassName = cn(
    'absolute z-20 mt-2 min-w-[14rem] origin-top rounded-lg border border-border/60 bg-card py-1 shadow-md focus:outline-none',
    fullWidth ? 'start-0 end-0 w-full' : 'end-0 w-56',
    variant === 'pill' && 'start-0 end-auto',
  );

  return (
    <Menu
      as="div"
      className={cn('relative inline-block', className)}
    >
      {({ open }) => (
        <>
          <Menu.Button className={menuButtonClassName}>
            <span>
              {t(
                variant === 'inline'
                  ? 'product-bulk-import-choose-type'
                  : 'product-bulk-import-menu-label'
              )}
            </span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                open && 'rotate-180',
                variant === 'button' || variant === 'pill'
                  ? 'text-white'
                  : 'text-muted-foreground',
              )}
            />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items as="ul" className={menuItemsClassName}>
              {PRODUCT_IMPORTS.map((importType) => (
                <Menu.Item key={importType.key} as="li">
                  {({ active }) => (
                    <Link
                      href={importType.href(shop)}
                      className={cn(
                        'block px-4 py-2.5 text-sm text-heading transition-colors hover:bg-muted/60 hover:text-accent',
                        active && 'bg-muted/60 text-accent',
                      )}
                    >
                      {t(importType.labelKey)}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
