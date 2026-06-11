import Card from '@/components/common/card';
import { CloseIcon } from '@/components/icons/close-icon';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal/modal';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type ClothingImportAnnouncementProps = {
  shop: string;
  canShow: boolean;
};

const ANNOUNCEMENT_VERSION = 'v2';

export default function ClothingImportAnnouncement({
  shop,
  canShow,
}: ClothingImportAnnouncementProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const storageKey = shop
    ? `clothing-import-announcement:${ANNOUNCEMENT_VERSION}:${shop}`
    : '';

  useEffect(() => {
    if (!canShow || !storageKey || typeof window === 'undefined') return;
    setOpen(window.localStorage.getItem(storageKey) !== 'dismissed');
  }, [canShow, storageKey]);

  function dismiss() {
    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'dismissed');
    }
    setOpen(false);
  }

  function openImportWizard() {
    dismiss();
    router.push(Routes.product.clothingImport(shop));
  }

  if (!canShow) return null;

  return (
    <Modal open={open} onClose={dismiss}>
      <Card className="relative w-full max-w-xl p-6 md:p-8">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 flex h-8 w-8 items-center justify-center rounded-full text-body transition hover:bg-gray-100 hover:text-heading focus:bg-gray-100 focus:outline-none end-4"
          aria-label={t('common:text-close')}
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
        <h2 className="pe-10 text-lg font-semibold text-heading">
          {t('common:clothing-import-announcement-title')}
        </h2>
        <p className="mt-3 text-sm leading-6 text-body">
          {t('common:clothing-import-announcement-body')}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={openImportWizard}>
            {t('common:clothing-import-announcement-primary')}
          </Button>
          <Button variant="outline" onClick={openImportWizard}>
            {t('common:clothing-import-announcement-secondary')}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
