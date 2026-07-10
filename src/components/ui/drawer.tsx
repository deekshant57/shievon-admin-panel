import * as SheetPrimitive from '@radix-ui/react-dialog';
import {
  Sheet,
  SheetOverlay,
  SheetPortal,
} from '@/components/ui/shadcn/sheet';
import { cn } from '@/lib/utils';
import {
  clearAllBodyScrollLocks,
  disableBodyScroll,
  enableBodyScroll,
} from 'body-scroll-lock';
import { useRouter } from 'next/router';
import { FC, useEffect, useRef } from 'react';

interface SidebarProps {
  children: any;
  open: boolean;
  variant?: 'left' | 'right';
  useBlurBackdrop?: boolean;
  onClose: () => void;
}

type DivElementRef = React.MutableRefObject<HTMLDivElement>;

const Drawer: FC<SidebarProps> = ({
  children,
  open = false,
  variant = 'right',
  useBlurBackdrop,
  onClose,
}) => {
  const { locale } = useRouter();
  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const ref = useRef() as DivElementRef;

  useEffect(() => {
    if (ref.current) {
      if (open) {
        disableBodyScroll(ref.current);
      } else {
        enableBodyScroll(ref.current);
      }
    }

    return () => {
      clearAllBodyScrollLocks();
    };
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetPortal>
        <SheetOverlay
          className={cn(
            'bg-dark/40',
            useBlurBackdrop && 'backdrop-blur-sm',
          )}
        />
        <SheetPrimitive.Content
          ref={ref}
          dir={dir}
          className={cn(
            'fixed inset-y-0 z-50 flex h-full w-screen max-w-md flex-col border-0 bg-card p-0 text-body shadow-xl outline-none transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            variant === 'right'
              ? 'ltr:right-0 rtl:left-auto data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
              : 'ltr:left-0 rtl:right-auto data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          )}
        >
          {children}
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default Drawer;
