import * as socialIcons from '@/components/icons/social';
import FormSection from '@/components/page/form-section';
import ActionButton from '@/components/ui/action-button';
import FileInput from '@/components/ui/file-input';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Select from '@/components/ui/select/select';
import SelectInput from '@/components/ui/select-input';
import TooltipLabel from '@/components/ui/tooltip-label';
import SwitchInput from '@/components/ui/switch-input';
import TextArea from '@/components/ui/text-area';
import { Config } from '@/config';
import { useSettingsQuery } from '@/data/settings';
import { useCreateShopMutation, useUpdateShopMutation } from '@/data/shop';
import {
  useUpdateSettlementPaymentInfoMutation,
  useVerifySettlementPaymentInfoMutation,
  useVendorSettlementQuery,
} from '@/data/vendor-settlement';
import {
  BalanceInput,
  IImage,
  ItemProps,
  ServiceScheduleEntry,
  Shop,
  ShopSettings,
  ShopSocialInput,
  UserAddressInput,
  Attachment,
  SettingsOptions,
} from '@/types';
import { getAuthCredentials } from '@/utils/auth-utils';
import { STAFF, STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { getFormattedImage } from '@/utils/get-formatted-image';
import { getIcon } from '@/utils/get-icon';
import { yupResolver } from '@hookform/resolvers/yup';
import { join, split } from 'lodash';
import omit from 'lodash/omit';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import OpenAIButton from '../openAI/openAI.button';
import { useModalAction } from '../ui/modal/modal.context';
import { shopValidationSchema } from './shop-validation-schema';
import { formatSlug } from '@/utils/use-slug';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import { siteSettings, socialIcon } from '@/settings/site.settings';
import { ShopDescriptionSuggestion } from '@/components/shop/shop-ai-prompt';
import ServiceScheduleForm from '@/components/shop/service-schedule-form';
import ShopLocationPicker, {
  ShopLocationPick,
} from '@/components/shop/shop-location-picker';
import PhoneNumberInput from '@/components/ui/phone-input';
import DatePicker from '@/components/ui/date-picker';
import { getDefaultSchedule } from '@/utils/serviceability';
import { addDays, addMinutes, isSameDay, isToday } from 'date-fns';
import Badge from '@/components/ui/badge/badge';
import Button from '@/components/ui/button';
import { resolveBankVerificationStatus } from '@/utils/bank-verification';
// const socialIcon = [
//   {
//     value: 'FacebookIcon',
//     label: 'Facebook',
//   },
//   {
//     value: 'InstagramIcon',
//     label: 'Instagram',
//   },
//   {
//     value: 'TwitterIcon',
//     label: 'Twitter',
//   },
//   {
//     value: 'YouTubeIcon',
//     label: 'Youtube',
//   },
// ];

export const updatedIcons = socialIcon.map((item: any) => {
  item.label = (
    <div className="flex items-center text-body space-s-4">
      <span className="flex items-center justify-center w-4 h-4">
        {getIcon({
          iconList: socialIcons,
          iconName: item.value,
          className: 'w-4 h-4',
        })}
      </span>
      <span>{item.label}</span>
    </div>
  );
  return item;
});

const SHOP_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { value, label: value };
});

type FormValues = {
  name: string;
  slug: string;
  description: string;
  cover_image: any;
  logo: any;
  balance: BalanceInput;
  address: UserAddressInput;
  settings: ShopSettings & { serviceSchedule?: ServiceScheduleEntry[] };
  timings: { open: string; close: string };
  isShopUnderMaintenance?: boolean;
};

function addressLine(parts: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}) {
  return [parts.street, parts.city, parts.state, parts.zip, parts.country]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

function coordKey(lat: unknown, lng: unknown) {
  const latitude = typeof lat === 'number' ? lat : Number(lat);
  const longitude = typeof lng === 'number' ? lng : Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

const resolveAttachmentIdForUpdate = (
  currentValue: any,
  initialValue: any,
): number | null | undefined => {
  // Uploader can emit [] when user removes a single-file image.
  if (Array.isArray(currentValue)) {
    if (currentValue.length === 0) return null;
    const first = currentValue[0];
    return first?.id != null ? Number(first.id) : undefined;
  }

  // Explicit clear (if emitted as null/empty).
  if (currentValue == null || currentValue === '') {
    return null;
  }

  // Newly uploaded image.
  if (currentValue?.id != null) {
    return Number(currentValue.id);
  }

  // Preloaded image without id (common API shape). Keep existing image by omitting *_id.
  if (initialValue?.id != null) {
    return Number(initialValue.id);
  }

  return undefined;
};

const ShopForm = ({ initialValues }: { initialValues?: Shop }) => {
  const { t } = useTranslation();
  const { mutate: createShop, isLoading: creating } = useCreateShopMutation();
  const { mutate: updateShop, isLoading: updating } = useUpdateShopMutation();
  const { mutate: updatePaymentInfo, isLoading: savingPayment } =
    useUpdateSettlementPaymentInfoMutation();
  const { mutate: verifyPaymentInfo, isLoading: verifying } =
    useVerifySettlementPaymentInfoMutation();
  const { settlement } = useVendorSettlementQuery(initialValues?.id, {
    enabled: Boolean(initialValues?.id),
    retry: false,
  });
  // const { permissions } = getAuthCredentials();
  // let permission = hasAccess(adminAndOwnerOnly, permissions);
  const { permissions } = getAuthCredentials();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    setValue,
    control,
  } = useForm<FormValues>({
    shouldUnregister: true,
    ...(initialValues
      ? {
          defaultValues: {
            ...initialValues,
            logo: getFormattedImage(initialValues?.logo as IImage),
            cover_image: getFormattedImage(
              initialValues?.cover_image as IImage,
            ),
            timings: {
              open: initialValues?.timings?.open ?? '09:00',
              close: initialValues?.timings?.close ?? '18:00',
            },
            balance: {
              id: initialValues?.balance?.id,
              payment_info: {
                name: initialValues?.balance?.payment_info?.name ?? '',
                email: initialValues?.balance?.payment_info?.email ?? '',
                bank: initialValues?.balance?.payment_info?.bank ?? '',
                account: initialValues?.balance?.payment_info?.account ?? '',
                ifsc: initialValues?.balance?.payment_info?.ifsc ?? '',
              },
            },
            settings: {
              ...initialValues?.settings,
              location: {
                ...(initialValues?.settings?.location ?? {}),
                pinAdjusted: Boolean(
                  (initialValues?.address as { lat?: unknown } | undefined)
                    ?.lat ?? initialValues?.settings?.location?.lat,
                ) &&
                  Boolean(
                    (initialValues?.address as { lng?: unknown } | undefined)
                      ?.lng ?? initialValues?.settings?.location?.lng,
                  ),
              },
              serviceSchedule:
                initialValues?.settings?.serviceSchedule?.length
                  ? initialValues.settings.serviceSchedule
                  : getDefaultSchedule(),
              socials: initialValues?.settings?.socials
                ? initialValues?.settings?.socials.map((social: any) => ({
                    icon: updatedIcons?.find(
                      (icon) => icon?.value === social?.icon,
                    ),
                    url: social?.url,
                  }))
                : [],
            },
            // Sync address from settings.location when address is empty (API may only return location)
            address: {
              country:
                initialValues?.address?.country ??
                (initialValues?.settings?.location as any)?.country ??
                '',
              city:
                initialValues?.address?.city ??
                (initialValues?.settings?.location as any)?.city ??
                '',
              state:
                initialValues?.address?.state ??
                (initialValues?.settings?.location as any)?.state ??
                '',
              zip:
                initialValues?.address?.zip ??
                (initialValues?.settings?.location as any)?.zip ??
                '',
              street_address:
                initialValues?.address?.street_address ??
                (initialValues?.settings?.location as any)?.street_address ??
                '',
            },
          },
        }
      : {
          defaultValues: {
            timings: { open: '09:00', close: '18:00' },
            settings: {
              serviceSchedule: getDefaultSchedule(),
              location: { pinAdjusted: false },
            } as any,
            address: {
              country: '',
              city: '',
              state: '',
              zip: '',
              street_address: '',
            },
          },
        }),
    resolver: yupResolver(shopValidationSchema) as any,
  });

  // Prefer settlement payment_info (includes IFSC + verification) when available
  useEffect(() => {
    const payment = settlement?.payment_info;
    if (!payment) return;
    if (payment.name != null) setValue('balance.payment_info.name', payment.name);
    if (payment.email != null)
      setValue('balance.payment_info.email', payment.email);
    if (payment.bank != null) setValue('balance.payment_info.bank', payment.bank);
    if (payment.account != null)
      setValue('balance.payment_info.account', String(payment.account));
    if (payment.ifsc != null) setValue('balance.payment_info.ifsc', payment.ifsc);
  }, [settlement?.payment_info, setValue]);

  const router = useRouter();

  const { openModal } = useModalAction();
  const { locale } = router;
  const { settings } = useSettingsQuery({
    language: locale!,
  });
  // Safely extract options to avoid runtime error when settings is undefined
  const options: SettingsOptions = (settings?.options as SettingsOptions) || ({} as SettingsOptions);

  const generateName = watch('name');
  const shopDescriptionSuggestionLists = useMemo(() => {
    return ShopDescriptionSuggestion({ name: generateName ?? '' });
  }, [generateName]);

  const handleGenerateDescription = useCallback(() => {
    openModal('GENERATE_DESCRIPTION', {
      control,
      name: generateName,
      set_value: setValue,
      key: 'description',
      suggestion: shopDescriptionSuggestionLists as ItemProps[],
    });
  }, [generateName]);

  const slugAutoSuggest = formatSlug(watch('name'));

  const startDate = useWatch({
    name: 'settings.shopMaintenance.start',
    control,
  });
  const untilDate = useWatch({
    name: 'settings.shopMaintenance.until',
    control,
  });
  const isMaintenanceMode = watch('settings.isShopUnderMaintenance');
  const shopLocation = useWatch({
    control,
    name: 'settings.location',
  });

  const addressEchoRef = useRef('');
  const coordEchoRef = useRef(
    coordKey(
      (initialValues?.address as { lat?: unknown } | undefined)?.lat ??
        initialValues?.settings?.location?.lat,
      (initialValues?.address as { lng?: unknown } | undefined)?.lng ??
        initialValues?.settings?.location?.lng,
    ),
  );
  const [addressMovedPin, setAddressMovedPin] = useState(false);

  const applyPickedLocation = useCallback(
    (location: ShopLocationPick) => {
      const current = (getValues('settings.location') || {}) as Record<
        string,
        unknown
      >;
      const currentAddress = getValues('address');
      const lat =
        location.lat != null && String(location.lat).trim() !== ''
          ? Number(location.lat)
          : undefined;
      const lng =
        location.lng != null && String(location.lng).trim() !== ''
          ? Number(location.lng)
          : undefined;
      const updateAddress = location.addressResolved !== false;
      const keepText = (incoming: unknown, previous: unknown) => {
        const text = typeof incoming === 'string' ? incoming.trim() : '';
        if (text) return text;
        return typeof previous === 'string' ? previous : '';
      };
      const street = keepText(
        location.street_address,
        currentAddress?.street_address,
      );
      const city = keepText(location.city, currentAddress?.city);
      const state = keepText(location.state, currentAddress?.state);
      const country = keepText(location.country, currentAddress?.country);
      const zip = location.zip?.trim() ?? '';
      if (updateAddress) {
        addressEchoRef.current = addressLine({
          street,
          city,
          state,
          zip,
          country,
        });
        setAddressMovedPin(false);
      }
      if (lat != null && Number.isFinite(lat) && lng != null && Number.isFinite(lng)) {
        coordEchoRef.current = coordKey(lat, lng);
      }

      if (updateAddress) {
        setValue('address.street_address', street, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('address.city', city, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('address.state', state, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('address.zip', zip, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('address.country', country, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setValue(
        'settings.location',
        {
          ...current,
          ...(updateAddress
            ? {
                street_address: street,
                city,
                state,
                zip,
                country,
                formattedAddress:
                  location.formattedAddress ?? current.formattedAddress,
              }
            : {}),
          ...(lat != null && Number.isFinite(lat) ? { lat } : {}),
          ...(lng != null && Number.isFinite(lng) ? { lng } : {}),
          ...(typeof location.pinAdjusted === 'boolean'
            ? { pinAdjusted: location.pinAdjusted }
            : {}),
        } as FormValues['settings']['location'],
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [getValues, setValue],
  );

  const today = new Date();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.socials',
  });

  // Sync address into form state on mount when address is pre-filled (unregistered fields
  // can be missing from form state with shouldUnregister, so setValue ensures they exist)
  useEffect(() => {
    if (!initialValues) return
    const loc = initialValues?.settings?.location as any
    const addr = initialValues?.address
    const addrAny = addr as any
    const country = addr?.country ?? loc?.country ?? ''
    const city = addr?.city ?? loc?.city ?? ''
    const state = addr?.state ?? loc?.state ?? ''
    const zip = addr?.zip ?? loc?.zip ?? ''
    const street_address = addr?.street_address ?? loc?.street_address ?? ''
    const lat = addrAny?.lat ?? loc?.lat ?? ''
    const lng = addrAny?.lng ?? loc?.lng ?? ''
    if (country || city || state || zip || street_address) {
      setValue('address.country', country)
      setValue('address.city', city)
      setValue('address.state', state)
      setValue('address.zip', zip)
      setValue('address.street_address', street_address)

      const formattedAddress =
        loc?.formattedAddress ||
        [street_address, city, state, zip, country]
          .filter((part) => String(part ?? '').trim() !== '')
          .join(', ')

      addressEchoRef.current = addressLine({
        street: street_address,
        city,
        state,
        zip,
        country,
      })
      setValue('settings.location', {
        ...loc,
        country,
        city,
        state,
        zip,
        street_address,
        lat,
        lng,
        formattedAddress,
        pinAdjusted:
          String(lat ?? '').trim() !== '' && String(lng ?? '').trim() !== '',
      })
    }
  }, [initialValues, setValue])

  const watchedStreet = watch('address.street_address');
  const watchedCity = watch('address.city');
  const watchedState = watch('address.state');
  const watchedZip = watch('address.zip');
  const watchedCountry = watch('address.country');

  useEffect(() => {
    const line = addressLine({
      street: watchedStreet,
      city: watchedCity,
      state: watchedState,
      zip: watchedZip,
      country: watchedCountry,
    });
    if (line.length < 3 || line === addressEchoRef.current) return;

    const timer = window.setTimeout(() => {
      const current = (getValues('settings.location') || {}) as {
        pinAdjusted?: boolean;
        lat?: number;
        lng?: number;
      };
      if (current.pinAdjusted) {
        addressEchoRef.current = line;
        return;
      }
      if (typeof google === 'undefined' || !google.maps?.Geocoder) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: line }, (results, status) => {
        const latest = addressLine({
          street: getValues('address.street_address'),
          city: getValues('address.city'),
          state: getValues('address.state'),
          zip: getValues('address.zip'),
          country: getValues('address.country'),
        });
        if (latest !== line) return;
        const placed = getValues('settings.location') as { pinAdjusted?: boolean } | undefined;
        if (placed?.pinAdjusted) return;
        if (status !== 'OK' || !results?.[0]?.geometry?.location) return;

        const nextLat = results[0].geometry.location.lat();
        const nextLng = results[0].geometry.location.lng();
        const location = (getValues('settings.location') || {}) as Record<string, unknown>;
        addressEchoRef.current = line;
        coordEchoRef.current = coordKey(nextLat, nextLng);
        setAddressMovedPin(true);
        setValue(
          'settings.location',
          {
            ...location,
            lat: nextLat,
            lng: nextLng,
            pinAdjusted: false,
          } as FormValues['settings']['location'],
          { shouldDirty: true, shouldValidate: true },
        );
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    watchedStreet,
    watchedCity,
    watchedState,
    watchedZip,
    watchedCountry,
    getValues,
    setValue,
  ]);

  useEffect(() => {
    const key = coordKey(shopLocation?.lat, shopLocation?.lng);
    if (!key || key === coordEchoRef.current) return;
    coordEchoRef.current = key;
    const current = (getValues('settings.location') || {}) as Record<string, unknown>;
    setAddressMovedPin(false);
    setValue(
      'settings.location',
      {
        ...current,
        pinAdjusted: true,
      } as FormValues['settings']['location'],
      { shouldDirty: true, shouldValidate: true },
    );
  }, [shopLocation?.lat, shopLocation?.lng, getValues, setValue]);

  const isSlugEditable =
    (router?.query?.action === 'edit' || router?.pathname === '/[shop]/edit') &&
    router?.locale === Config.defaultLanguage;

  // Slug stays in payload but is hidden in UI (create/edit).
  // Keep it in sync with the auto-suggested value when user types name.
  useEffect(() => {
    if (initialValues) return
    if (isSlugEditable) return
    if (!slugAutoSuggest) return
    setValue('slug', slugAutoSuggest)
  }, [initialValues, isSlugEditable, setValue, slugAutoSuggest])

  function onSubmit(values: FormValues) {
    const location = {
      ...omit(values?.settings?.location, ['__typename', 'pinAdjusted']),
    } as any;
    const normalizedLat =
      location?.lat != null && String(location.lat).trim() !== ''
        ? Number(location.lat)
        : undefined;
    const normalizedLng =
      location?.lng != null && String(location.lng).trim() !== ''
        ? Number(location.lng)
        : undefined;

    const normalizedAddress = {
      ...values.address,
      ...(normalizedLat !== undefined ? { lat: normalizedLat } : {}),
      ...(normalizedLng !== undefined ? { lng: normalizedLng } : {}),
    };

    const settings = {
      ...values?.settings,
      location: {
        ...location,
        ...(normalizedLat !== undefined ? { lat: normalizedLat } : {}),
        ...(normalizedLng !== undefined ? { lng: normalizedLng } : {}),
      },
      serviceSchedule: values?.settings?.serviceSchedule,
      socials: values?.settings?.socials
        ? values?.settings?.socials?.map((social: any) => ({
            icon: social?.icon?.value,
            url: social?.url,
          }))
        : [],
      shopMaintenance: values?.settings?.shopMaintenance,
    };
    if (initialValues && values?.settings?.serviceSchedule) {
      console.log(
        `[ServiceSchedule] Shop ${initialValues.id} schedule updated at ${new Date().toISOString()}`,
        JSON.stringify(values.settings.serviceSchedule),
      );
    }
    if (initialValues) {
      const { cover_image, logo, address: _address, settings: _settings, ...restValues } = values;
      const paymentInfo = values.balance?.payment_info;
      const payload = {
        id: initialValues?.id as string,
        ...restValues,
        address: normalizedAddress,
        settings,
        timings: values.timings,
        // Keep balance id for BC; settlement payment-info is source of truth for bank fields
        balance: {
          id: initialValues.balance?.id,
        },
      } as any;

      const nextCoverImageId = resolveAttachmentIdForUpdate(
        cover_image,
        initialValues?.cover_image,
      );
      const nextLogoId = resolveAttachmentIdForUpdate(logo, initialValues?.logo);

      if (nextCoverImageId !== undefined) {
        payload.cover_image_id = nextCoverImageId;
      }
      if (nextLogoId !== undefined) {
        payload.logo_id = nextLogoId;
      }

      updateShop(payload);

      if (paymentInfo && initialValues.id) {
        updatePaymentInfo({
          shopId: initialValues.id,
          name: paymentInfo.name,
          email: paymentInfo.email,
          bank: paymentInfo.bank,
          account:
            paymentInfo.account != null
              ? String(paymentInfo.account)
              : undefined,
          ifsc: paymentInfo.ifsc,
        });
      }
    } else {
      const { cover_image, logo, address: _address, settings: _settings, ...restValues } = values;
      createShop({
        ...restValues,
        address: normalizedAddress,
        settings,
        timings: values.timings,
        balance: {
          ...values.balance,
        },
        logo_id: logo?.id != null ? Number(logo.id) : null,
        cover_image_id:
          cover_image?.id != null ? Number(cover_image.id) : null,
      });
    }
  }

  const askForAQuote = watch('settings.askForAQuote.enable');

  const backendLogoWidth = Number((options as any)?.logo?.width);
  const backendLogoHeight = Number((options as any)?.logo?.height);
  const shopLogoWidth =
    Number.isFinite(backendLogoWidth) && backendLogoWidth > 0
      ? backendLogoWidth
      : siteSettings.logo.width;
  const shopLogoHeight =
    Number.isFinite(backendLogoHeight) && backendLogoHeight > 0
      ? backendLogoHeight
      : siteSettings.logo.height;

  const shopLogoInformation = (
    <span>
      {t('form:shop-logo-help-text')} <br />
      {t('form:logo-dimension-help-text')} &nbsp;
      <span className="font-bold">
        {shopLogoWidth}x{shopLogoHeight} {t('common:pixel')}
      </span>
    </span>
  );

  const coverImageInformation = (
    <span>
      {t('form:shop-cover-image-help-text')} <br />
      {t('form:cover-image-dimension-help-text')} &nbsp;
      <span className="font-bold">1170 x 435{t('common:text-px')}</span>
    </span>
  );

  let sameDay = useMemo(() => {
    return isSameDay(new Date(untilDate), new Date(startDate));
  }, [untilDate, startDate]);

  const filterUntilTime = (date: Date) => {
    if (sameDay) {
      const isPastTime =
        addMinutes(new Date(startDate), 15).getTime() > date.getTime();
      return !isPastTime;
    }

    return true;
  };

  const filterStartTime = (date: Date) => {
    let today = isToday(new Date(startDate));
    if (today) {
      const isPastTime = new Date(startDate).getTime() > date.getTime();
      return !isPastTime;
    }

    return true;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <FormSection
        title={t('form:input-label-logo')}
        details={shopLogoInformation}
      >
        <FileInput
          name="logo"
          control={control}
          multiple={false}
          skipDeleteOnRemove
        />
      </FormSection>

      <FormSection
        title={t('form:shop-cover-image-title')}
        details={coverImageInformation}
      >
        <FileInput
          name="cover_image"
          control={control}
          multiple={false}
          skipDeleteOnRemove
        />
      </FormSection>

      <FormSection
        title={t('form:shop-basic-info')}
        details={t('form:shop-basic-info-help-text')}
      >
        <Input
          label={t('form:input-label-name')}
          {...register('name')}
          variant="outline"
          className="mb-5"
          error={t(errors.name?.message!)}
          required
        />

        <input type="hidden" {...register('slug')} />

        <div className="relative">
          {options?.useAi && (
            <OpenAIButton
              title={t('form:button-label-description-ai')}
              onClick={handleGenerateDescription}
            />
          )}
          <TextArea
            label={t('form:input-label-description')}
            {...register('description')}
            variant="outline"
            error={t(errors.description?.message!)}
          />
        </div>
      </FormSection>

      <FormSection
        title={t('form:shop-payment-info')}
        details={t('form:payment-info-helper-text')}
      >
        {(() => {
          const verificationStatus = resolveBankVerificationStatus({
            settlement,
            shopPaymentInfo: initialValues?.balance?.payment_info,
          });

          if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.info('[bank-verify] edit-shop status', {
              shopId: initialValues?.id,
              fromSettlement:
                settlement?.payment_info?.verification_status ?? null,
              fromShopBalance:
                initialValues?.balance?.payment_info?.verification_status ??
                null,
              resolved: verificationStatus,
              hasSettlement: Boolean(settlement),
            });
          }

          const paymentWatch = watch('balance.payment_info');
          const canVerify = Boolean(
            initialValues?.id &&
              verificationStatus !== 'verified' &&
              paymentWatch?.name?.toString().trim() &&
              paymentWatch?.bank?.toString().trim() &&
              paymentWatch?.account != null &&
              String(paymentWatch.account).trim() &&
              paymentWatch?.ifsc?.toString().trim(),
          );
          const statusLabel =
            verificationStatus === 'verified'
              ? t('common:text-bank-verified') || 'Verified'
              : verificationStatus === 'pending'
                ? t('common:text-bank-pending') || 'Pending'
                : verificationStatus === 'failed'
                  ? t('common:text-bank-failed') || 'Failed'
                  : t('common:text-bank-unverified') || 'Unverified';
          const statusColor =
            verificationStatus === 'verified'
              ? 'bg-green-500 bg-opacity-10 text-green-600'
              : verificationStatus === 'failed'
                ? 'bg-red-500 bg-opacity-10 text-red-500'
                : 'bg-yellow-500 bg-opacity-10 text-yellow-700';

          return (
            <>
              {initialValues?.id ? (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Badge text={statusLabel} color={statusColor} />
                  {verificationStatus !== 'verified' ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="small"
                        loading={verifying}
                        disabled={!canVerify || verifying || savingPayment}
                        onClick={() => {
                          if (!initialValues?.id) return;
                          verifyPaymentInfo(initialValues.id);
                        }}
                      >
                        {t('form:button-label-verify-bank') || 'Verify bank'}
                      </Button>
                      {!canVerify ? (
                        <span className="text-xs text-muted-foreground">
                          {t('form:text-verify-bank-hint') ||
                            'Fill name, bank, account and IFSC, then save before verifying.'}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('form:text-bank-already-verified') ||
                        'Bank account verified. No further action needed.'}
                    </span>
                  )}
                </div>
              ) : null}
              <Input
                label={t('form:input-label-account-holder-name')}
                {...register('balance.payment_info.name')}
                variant="outline"
                className="mb-5"
                error={t(errors.balance?.payment_info?.name?.message!)}
              />
              <Input
                label={t('form:input-label-account-holder-email')}
                {...register('balance.payment_info.email')}
                variant="outline"
                className="mb-5"
                error={t(errors.balance?.payment_info?.email?.message!)}
              />
              <Input
                label={t('form:input-label-bank-name')}
                {...register('balance.payment_info.bank')}
                variant="outline"
                className="mb-5"
                error={t(errors.balance?.payment_info?.bank?.message!)}
              />
              <Input
                label={t('form:input-label-account-number')}
                {...register('balance.payment_info.account')}
                variant="outline"
                className="mb-5"
                error={t(errors.balance?.payment_info?.account?.message!)}
              />
              <Input
                label={t('form:input-label-ifsc') || 'IFSC'}
                {...register('balance.payment_info.ifsc')}
                variant="outline"
                className="mb-5"
                error={t(errors.balance?.payment_info?.ifsc?.message!)}
              />
            </>
          );
        })()}
      </FormSection>

      <FormSection
        title={t('form:shop-address')}
        details={t('form:shop-address-helper-text')}
      >
        <ShopLocationPicker
          latitude={shopLocation?.lat}
          longitude={shopLocation?.lng}
          formattedAddress={shopLocation?.formattedAddress}
          entranceConfirmed={shopLocation?.pinAdjusted === true}
          onChange={applyPickedLocation}
        />
        {(errors.settings?.location as { pinAdjusted?: { message?: string } })
          ?.pinAdjusted?.message ? (
          <p className="-mt-2 mb-4 text-xs text-red-500">
            {t(
              (errors.settings?.location as { pinAdjusted?: { message?: string } })
                .pinAdjusted?.message as string,
            )}
          </p>
        ) : null}
        <p className="mb-4 text-sm font-medium text-heading">
          {t('form:shop-address-structured-title')}
        </p>
        <div className="space-y-5">
          <Input
            label={t('form:input-label-street-address')}
            {...register('address.street_address')}
            variant="outline"
            className="mb-0"
            error={t(errors.address?.street_address?.message as string)}
            required
          />
          {addressMovedPin ? (
            <p className="text-xs text-amber-700">
              {t(
                'form:shop-location-address-moved-pin',
                'The pin moved to this address. Click the entrance or drag the pin if that point is off.',
              )}
            </p>
          ) : null}
          <Input
            label={t('form:input-label-city')}
            {...register('address.city')}
            variant="outline"
            className="mb-0"
            error={t(errors.address?.city?.message as string)}
            required
          />
          <Input
            label={t('form:input-label-state')}
            {...register('address.state')}
            variant="outline"
            className="mb-0"
            error={t(errors.address?.state?.message as string)}
            required
          />
          <div>
            <Input
              label={t('form:input-label-zip')}
              {...register('address.zip')}
              variant="outline"
              className="mb-0"
              error={t(errors.address?.zip?.message as string)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {t('form:shop-zip-manual-hint')}
            </p>
          </div>
          <Input
            label={t('form:input-label-country')}
            {...register('address.country')}
            variant="outline"
            className="mb-0"
            error={t(errors.address?.country?.message as string)}
            required
          />
          <Input
            label={t('form:input-label-latitude')}
            {...register('settings.location.lat')}
            variant="outline"
            type="number"
            step="any"
            className="mb-0"
            error={t(errors.settings?.location?.lat?.message as string)}
            required
          />
          <Input
            label={t('form:input-label-longitude')}
            {...register('settings.location.lng')}
            variant="outline"
            type="number"
            step="any"
            className="mb-0"
            error={t(errors.settings?.location?.lng?.message as string)}
            required
          />
          <p className="-mt-2 text-xs text-muted-foreground">
            {t(
              'form:shop-location-coordinates-hint',
              'These update when you move the pin. Type them if you already know the exact point.',
            )}
          </p>
        </div>
      </FormSection>

      {permissions?.includes(STORE_OWNER) ? (
        <FormSection
          title={t('form:form-notification-title')}
          details={t('form:form-notification-description')}
        >
          <Input
            label={t('form:input-notification-email')}
            {...register('settings.notifications.email')}
            error={t(errors?.settings?.notifications?.email?.message!)}
            variant="outline"
            className="mb-5"
            disabled={permissions?.includes(SUPER_ADMIN)}
            type="email"
          />
          <div className="flex items-center gap-x-4">
            <SwitchInput
              name="settings.notifications.enable"
              control={control}
              disabled={permissions?.includes(SUPER_ADMIN)}
            />
            <Label className="!mb-0.5">
              {t('form:input-enable-notification')}
            </Label>
          </div>
        </FormSection>
      ) : null}

      <FormSection
        title={t('form:shop-settings')}
        details={t('form:shop-settings-helper-text')}
      >
        <PhoneNumberInput
          label={t('form:input-label-contact')}
          required
          {...register('settings.contact')}
          control={control}
          error={t(errors.settings?.contact?.message!)}
        />
        <Input
          label={t('form:input-label-website')}
          {...register('settings.website')}
          variant="outline"
          className="mb-5"
          error={t(errors.settings?.website?.message!)}
        />
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-5">
          <div className="mb-5 sm:mb-0">
            <TooltipLabel
              htmlFor="timings.open"
              label={t('form:input-label-opening-time')}
              required
            />
            <Controller
              control={control}
              name="timings.open"
              render={({ field }) => (
                <Select
                  {...field}
                  value={
                    SHOP_TIME_OPTIONS.find((o) => o.value === field.value) ??
                    null
                  }
                  onChange={(option: any) =>
                    field.onChange(option?.value ?? '')
                  }
                  options={SHOP_TIME_OPTIONS}
                />
              )}
            />
            {errors.timings?.open?.message && (
              <p className="my-2 text-start text-xs text-red-500">
                {t(errors.timings.open.message)}
              </p>
            )}
          </div>
          <div className="mb-5 sm:mb-0">
            <TooltipLabel
              htmlFor="timings.close"
              label={t('form:input-label-closing-time')}
              required
            />
            <Controller
              control={control}
              name="timings.close"
              render={({ field }) => (
                <Select
                  {...field}
                  value={
                    SHOP_TIME_OPTIONS.find((o) => o.value === field.value) ??
                    null
                  }
                  onChange={(option: any) =>
                    field.onChange(option?.value ?? '')
                  }
                  options={SHOP_TIME_OPTIONS}
                />
              )}
            />
            {errors.timings?.close?.message && (
              <p className="my-2 text-start text-xs text-red-500">
                {t(errors.timings.close.message)}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title={t('form:operating-hours-title')}
        details={t('form:operating-hours-help-text')}
      >
        <ServiceScheduleForm
          control={control}
          setValue={setValue}
        />
      </FormSection>

      <FormSection
        title={t('form:social-settings')}
        details={t('form:social-settings-helper-text')}
      >
        <div>
          {fields?.map(
            (item: ShopSocialInput & { id: string }, index: number) => (
              <div
                className="border-b border-dashed border-border-200 py-5 first:mt-0 first:border-t-0 first:pt-0 last:border-b-0 md:py-8 md:first:mt-0"
                key={item.id}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <Label>{t('form:input-label-select-platform')}</Label>
                    <SelectInput
                      name={`settings.socials.${index}.icon` as const}
                      control={control}
                      options={updatedIcons}
                      isClearable={true}
                      defaultValue={item?.icon!}
                    />
                  </div>
                  <Input
                    className="sm:col-span-2"
                    label={t('form:input-label-url')}
                    variant="outline"
                    {...register(`settings.socials.${index}.url` as const)}
                    error={t(errors?.settings?.socials?.[index]?.url?.message!)}
                    defaultValue={item.url!}
                    required
                  />
                  <button
                    onClick={() => {
                      remove(index);
                    }}
                    type="button"
                    className="text-sm text-red-500 transition-colors duration-200 hover:text-red-700 focus:outline-none sm:col-span-1 sm:mt-4"
                  >
                    {t('form:button-label-remove')}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
        <ActionButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ icon: '', url: '' })}
          className="w-full sm:w-auto"
        >
          {t('form:button-label-add-social')}
        </ActionButton>
      </FormSection>

      {!permissions?.includes(SUPER_ADMIN) ? (
        <FormSection
          title={t('form:shop-maintenance-title') || 'Shop maintenance settings'}
          details={
            t('form:shop-maintenance-help-text') ||
            'Control all the maintenance settings related to this shop.'
          }
        >
          <div className="mb-5">
            <SwitchInput
              name="settings.isShopUnderMaintenance"
              label={t('form:input-label-enable-maintenance-mode')}
              toolTipText={t('form:input-tooltip-enable-maintenance-mode')}
              control={control}
            />
          </div>

          <div className="mb-5">
            <FileInput
              name="settings.shopMaintenance.image"
              control={control}
              multiple={false}
              disabled={!isMaintenanceMode}
            />
          </div>

          <Input
            label={t('form:input-label-title')}
            toolTipText={t('form:input-tooltip-maintenance-title')}
            {...register('settings.shopMaintenance.title')}
            error={t(errors?.settings?.shopMaintenance?.title?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <TextArea
            label={t('form:input-label-description')}
            toolTipText={t('form:input-tooltip-maintenance-description')}
            {...register('settings.shopMaintenance.description')}
            error={t(errors?.settings?.shopMaintenance?.description?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <div className="mb-5">
            <DatePicker
              control={control}
              name="settings.shopMaintenance.start"
              minDate={today}
              startDate={new Date(startDate)}
              locale={locale}
              placeholder="Start Date"
              disabled={!isMaintenanceMode}
              label={t('form:maintenance-start-time')}
              toolTipText={t('form:input-tooltip-maintenance-start-time')}
              {...(isMaintenanceMode && {
                required: true,
              })}
              error={t(errors?.settings?.shopMaintenance?.start?.message!)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              filterTime={filterStartTime}
            />
          </div>
          <div className="w-full">
            <DatePicker
              control={control}
              name="settings.shopMaintenance.until"
              disabled={!startDate || !isMaintenanceMode}
              minDate={new Date(startDate)}
              placeholder="End Date"
              locale={locale}
              {...(isMaintenanceMode && {
                required: true,
              })}
              toolTipText={t('form:input-tooltip-maintenance-end-time')}
              label={t('form:maintenance-end-date')}
              error={t(errors?.settings?.shopMaintenance?.until?.message!)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              filterTime={filterUntilTime}
            />
          </div>
        </FormSection>
      ) : null}

      {!permissions?.includes(SUPER_ADMIN) &&
      !permissions?.includes(STAFF) &&
      !Boolean(initialValues?.is_active) &&
      Boolean(options?.isMultiCommissionRate) ? (
        <FormSection
          title={t('form:ask-for-quote-title') || 'Ask for a quote?'}
          details={
            t('form:ask-for-quote-help-text') || 'Set your ask for a quote here.'
          }
        >
          <SwitchInput
            name="settings.askForAQuote.enable"
            control={control}
            label="Ask for a quote?"
            className={askForAQuote ? 'mb-4' : ''}
          />
          {askForAQuote ? (
            <>
              <Input
                label="Quote"
                {...register('settings.askForAQuote.quote')}
                variant="outline"
                className="mb-5"
                error={t(errors?.settings?.askForAQuote?.quote?.message)}
                required
              />
              <TextArea
                label="Ask for a quote content."
                {...register('settings.askForAQuote.content')}
                variant="outline"
                error={t(errors?.settings?.askForAQuote?.content?.message)}
                required
              />
            </>
          ) : null}
        </FormSection>
      ) : null}

      <StickyFooterPanel className="z-0">
        <div className="flex flex-col-reverse gap-3 text-end sm:flex-row sm:justify-end">
          {initialValues ? (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={router.back}
              type="button"
              className="w-full sm:w-auto"
            >
              {t('form:button-label-back')}
            </ActionButton>
          ) : null}
          <ActionButton
            type="submit"
            variant="primary"
            size="sm"
            loading={creating || updating || savingPayment}
            disabled={creating || updating || savingPayment}
            className="w-full sm:w-auto"
          >
            {initialValues
              ? t('form:button-label-update')
              : t('form:button-label-save')}
          </ActionButton>
        </div>
      </StickyFooterPanel>
    </form>
  );
};

export default ShopForm;
