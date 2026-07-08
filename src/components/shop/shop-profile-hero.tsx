import { EditFillIcon } from '@/components/icons/edit';
import { EmailAtIcon } from '@/components/icons/email';
import { ExternalLinkIcon } from '@/components/icons/external-link';
import { MapPinIconWithPlatform } from '@/components/icons/map-pin';
import { PhoneIconNew } from '@/components/icons/phone';
import ProductBulkImportMenu from '@/components/product/product-bulk-import-menu';
import { ContentListHorizontal } from '@/components/shop-single/content-list';
import ShopAvatar from '@/components/shop/shop-avatar';
import Badge from '@/components/ui/badge/badge';
import Link from '@/components/ui/link';
import LinkActionButton from '@/components/ui/link-action-button';
import {
  Card,
  CardContent,
} from '@/components/ui/shadcn/card';
import { Routes } from '@/config/routes';
import { IImage, Shop, User, UserAddress } from '@/types';
import { formatAddress } from '@/utils/format-address';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import { cn } from '@/lib/utils';
import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

type ShopProfileHeroProps = {
  name?: string;
  slug?: string;
  is_active?: boolean;
  logo?: IImage;
  cover_image?: IImage;
  owner?: User;
  address?: UserAddress;
  settings?: Shop['settings'];
  shopSlug: string;
  canEdit?: boolean;
  className?: string;
};

const ShopProfileHero = ({
  name,
  slug,
  is_active,
  logo,
  cover_image,
  owner,
  address,
  settings,
  shopSlug,
  canEdit = false,
  className,
}: ShopProfileHeroProps) => {
  const { t } = useTranslation();

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: settings?.contact as string,
  });

  const formattedAddress = address ? formatAddress(address) : '';

  return (
    <Card className={cn('overflow-hidden border-border/60 shadow-sm', className)}>
      <div className="relative h-28 overflow-hidden bg-muted/40 lg:h-32">
        <Image
          src={cover_image?.original ?? '/shop-fallback-cover-photo.png'}
          height={600}
          width={1200}
          sizes="(max-width: 768px) 100vw"
          alt={name ?? ''}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute right-3 top-3">
          <Badge
            textKey={
              is_active ? 'common:text-active' : 'common:text-inactive'
            }
            color={
              is_active
                ? 'bg-emerald-500/10 !text-emerald-700'
                : 'bg-status-failed/10 text-status-failed'
            }
          />
        </div>
      </div>

      <CardContent className="px-5 pb-5 pt-0">
        <div className="-mt-10 flex flex-wrap items-end gap-4 lg:gap-6">
          <ShopAvatar
            is_active={is_active}
            name={name}
            logo={logo as any}
            size="medium"
            className="shadow-sm"
          />

          <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-auto">
              <div className="mb-3 flex items-center gap-2">
                {name ? (
                  <h1 className="text-xl font-bold tracking-tight text-heading md:text-2xl">
                    {name}
                  </h1>
                ) : null}
                {slug ? (
                  <Link
                    href={Routes.visitStore(`shops/${slug}`)}
                    target="_blank"
                    className="text-muted-foreground transition-colors duration-200 hover:text-accent"
                  >
                    <ExternalLinkIcon />
                  </Link>
                ) : null}
              </div>

              <div className="flex flex-col space-y-3 divide-border/60 xl:flex-row xl:space-x-5 xl:space-y-0 xl:divide-x">
                {owner?.email ? (
                  <ContentListHorizontal
                    content={owner.email}
                    isLink
                    link={`mailto:${owner.email}`}
                  >
                    <EmailAtIcon />
                  </ContentListHorizontal>
                ) : null}

                {!isEmpty(formattedAddress) ? (
                  <ContentListHorizontal
                    content={formattedAddress as string}
                    className="xl:pl-5"
                    link={`https://www.google.com/maps/place/${formattedAddress}`}
                    isLink
                  >
                    <MapPinIconWithPlatform />
                  </ContentListHorizontal>
                ) : null}

                {phoneNumber ? (
                  <ContentListHorizontal
                    content={phoneNumber}
                    isLink
                    className="xl:pl-5"
                    link={`tel:${phoneNumber}`}
                  >
                    <PhoneIconNew />
                  </ContentListHorizontal>
                ) : null}
              </div>
            </div>

            {canEdit ? (
              <div className="flex flex-wrap items-center gap-3 self-end pt-4 xl:pt-0">
                <ProductBulkImportMenu shop={shopSlug} variant="pill" />
                <LinkActionButton
                  href={`/${shopSlug}/edit`}
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center gap-1.5"
                >
                  <EditFillIcon />
                  {t('common:text-edit-shop')}
                </LinkActionButton>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopProfileHero;
