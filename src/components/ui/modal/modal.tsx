import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CloseIcon } from '@/components/icons/close-icon';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/shadcn/dialog';
import {
  approveModalInitialValues,
  searchModalInitialValues,
} from '@/utils/constants';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useRef } from 'react';

export default function Modal({ open, onClose, children }: any) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const [searchModal] = useAtom(searchModalInitialValues);
  const [approveModal] = useAtom(approveModalInitialValues);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          dir={dir}
        >
          <div
            className={cn(
              'min-h-full text-center md:p-5',
              searchModal ? 'pt-3 md:pt-2.5 lg:pt-4' : '',
            )}
          >
            <span
              className={cn(
                'inline-block h-screen',
                searchModal ? 'mt-16 align-top' : 'align-middle',
              )}
              aria-hidden="true"
            >
              &#8203;
            </span>
            <DialogPrimitive.Content
              className={cn(
                'min-w-content relative inline-block max-w-full align-middle outline-none transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ltr:text-left rtl:text-right',
              )}
            >
              <button
                onClick={onClose}
                aria-label="Close panel"
                ref={cancelButtonRef}
                className={cn(
                  'absolute top-4 z-[60] inline-block rounded-md outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ltr:right-4 rtl:left-4 lg:hidden',
                  searchModal || approveModal ? 'hidden' : '',
                )}
              >
                <span className="sr-only">{t('text-close')}</span>
                <CloseIcon className="h-4 w-4" />
              </button>
              {children}
            </DialogPrimitive.Content>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
