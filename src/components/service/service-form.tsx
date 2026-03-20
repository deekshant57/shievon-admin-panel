import Card from '@/components/common/card'
import Description from '@/components/ui/description'
import Input from '@/components/ui/input'
import TextArea from '@/components/ui/text-area'
import Label from '@/components/ui/label'
import Button from '@/components/ui/button'
import FileInput from '@/components/ui/file-input'
import SelectInput from '@/components/ui/select-input'
import ValidationError from '@/components/ui/form-validation-error'
import StickyFooterPanel from '@/components/ui/sticky-footer-panel'
import Alert from '@/components/ui/alert'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { useTypesQuery } from '@/data/type'
import { isServiceType } from '@/utils/service-type'
import type { ServiceOffering } from '@/types'
import {
  useCreateServiceOfferingMutation,
  useUpdateServiceOfferingMutation,
} from '@/data/service-offering'
import { getErrorMessage } from '@/utils/form-error'

type FormValues = {
  type: any
  name: string
  description?: string
  base_price?: number
  sale_price?: number
  image?: any
  gallery?: any[]
}

const serviceValidationSchema = yup.object().shape({
  type: yup.mixed().required('form:error-type-required'),
  name: yup.string().required('form:error-name-required'),
  base_price: yup
    .number()
    .typeError('form:error-price-must-number')
    .transform((value, originalValue) =>
      originalValue === '' || originalValue == null ? undefined : value,
    )
    .positive('form:error-price-must-positive')
    .optional(),
  sale_price: yup
    .number()
    .typeError('form:error-price-must-number')
    .transform((value, originalValue) =>
      originalValue === '' || originalValue == null ? undefined : value,
    )
    .positive('form:error-sale-price-must-positive')
    .optional()
    .test(
      'sale_price_not_higher_than_base_price',
      'form:error-sale-price-less-number',
      function (salePrice) {
        const { base_price } = this.parent as any
        if (salePrice == null || base_price == null) return true
        return Number(salePrice) <= Number(base_price)
      },
    ),
})

const defaultValues: FormValues = {
  type: null,
  name: '',
  description: '',
  base_price: undefined,
  sale_price: undefined,
  image: null,
  gallery: [],
}

type Props = {
  initialValues?: ServiceOffering | null
  shopId: number
}

export default function CreateOrUpdateServiceOfferingForm({
  initialValues,
  shopId,
}: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const { locale } = router
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { types, loading: loadingTypes } = useTypesQuery({
    limit: 999,
    language: locale,
  })
  const serviceTypes = useMemo(
    () => (types ?? []).filter((type: any) => isServiceType(type)),
    [types],
  )

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: initialValues
      ? {
          type:
            (initialValues as any)?.type?.id != null
              ? serviceTypes.find(
                  (t: any) => Number(t?.id) === Number((initialValues as any)?.type?.id),
                ) ?? null
              : initialValues?.typeId != null
                ? serviceTypes.find(
                    (t: any) => Number(t?.id) === Number(initialValues.typeId),
                  ) ?? null
                : null,
          name: initialValues?.name ?? '',
          description: initialValues?.description ?? '',
          base_price:
            typeof initialValues?.basePrice === 'string'
              ? Number(initialValues.basePrice)
              : (initialValues?.basePrice as number | undefined),
          sale_price:
            typeof initialValues?.salePrice === 'string'
              ? Number(initialValues.salePrice)
              : (initialValues?.salePrice as number | undefined),
          image: (initialValues as any)?.image ?? null,
          gallery: (initialValues as any)?.gallery ?? [],
        }
      : defaultValues,
    //@ts-ignore
    resolver: yupResolver(serviceValidationSchema),
  })

  // Pre-populate Group (type) on edit once types load (API may send `type` relation object)
  useEffect(() => {
    if (!initialValues) return
    if (!serviceTypes.length) return
    const current = getValues('type')
    if (current?.id != null) return

    const initialTypeId =
      (initialValues as any)?.type?.id ?? (initialValues as any)?.typeId
    if (initialTypeId == null) return

    const match =
      serviceTypes.find((t: any) => Number(t?.id) === Number(initialTypeId)) ?? null
    if (match) setValue('type', match, { shouldValidate: true })
  }, [getValues, initialValues, serviceTypes, setValue])

  const { mutate: createServiceOffering, isLoading: creating } =
    useCreateServiceOfferingMutation()
  const { mutate: updateServiceOffering, isLoading: updating } =
    useUpdateServiceOfferingMutation()

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null)

    const input = {
      shop_id: shopId,
      type_id: Number(values.type?.id),
      // Hidden from UI by request; keep safe defaults for API compatibility.
      offering_type_id: Number((initialValues as any)?.offeringTypeId ?? 1),
      name: values.name,
      description: values.description,
      base_price: values.base_price != null ? Number(values.base_price) : undefined,
      sale_price: values.sale_price != null ? Number(values.sale_price) : undefined,
      currency: (initialValues as any)?.currency ?? 'INR',
      duration_minutes:
        (initialValues as any)?.durationMinutes ??
        (initialValues as any)?.duration_minutes ??
        undefined,
      status: (initialValues as any)?.status ?? 'active',
      image: values.image
        ? {
            thumbnail: values?.image?.thumbnail,
            original: values?.image?.original,
            id: values?.image?.id,
          }
        : undefined,
      gallery: Array.isArray(values.gallery)
        ? values.gallery.map((g: any) => ({
            thumbnail: g?.thumbnail,
            original: g?.original,
            id: g?.id,
          }))
        : undefined,
    }

    try {
      if (!initialValues?.id) {
        createServiceOffering(input as any)
      } else {
        updateServiceOffering({
          id: String(initialValues.id),
          ...(input as any),
        })
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  const selectedName = watch('name')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage ? (
        <Alert
          message={errorMessage}
          variant="error"
          closeable={true}
          onClose={() => setErrorMessage(null)}
          className="mb-5"
        />
      ) : null}

      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title={t('form:input-label-image') || 'Image'}
          details={t('Upload a main image for this service') || 'Upload a main image for this service'}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />
        <Card className="w-full sm:w-8/12 md:w-2/3">
          <FileInput name="image" control={control} multiple={false} />
        </Card>
      </div>

      <div className="my-5 flex flex-wrap sm:my-8">
        <Description
          title={t('Service details') || 'Service details'}
          details={
            t('Provide the basic details for this service offering') ||
            'Provide the basic details for this service offering'
          }
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <div className="mb-5">
            <Label>{t('form:input-label-group') || 'Group'}*</Label>
            <SelectInput
              name="type"
              control={control}
              options={serviceTypes}
              isLoading={loadingTypes}
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option.id}
            />
            <ValidationError message={t((errors as any)?.type?.message)} />
          </div>

          <Input
            label={(t('form:input-label-name') || 'Name') + '*'}
            {...register('name')}
            error={t((errors as any)?.name?.message)}
            variant="outline"
            className="mb-5"
          />

          <TextArea
            label={t('form:input-label-description') || 'Description'}
            {...register('description')}
            variant="outline"
            className="mb-5"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label={t('form:input-label-price') || 'Base price'}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              {...register('base_price')}
              error={t((errors as any)?.base_price?.message)}
              variant="outline"
            />
            <Input
              label={t('form:input-label-sale-price') || 'Sale price'}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              {...register('sale_price')}
              error={t((errors as any)?.sale_price?.message)}
              variant="outline"
            />
          </div>
        </Card>
      </div>

      <StickyFooterPanel>
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            loading={creating || updating}
            disabled={creating || updating}
            type="submit"
          >
            {initialValues?.id
              ? t('form:button-label-update') || 'Update'
              : t('form:button-label-add') || 'Create'}
          </Button>
        </div>
      </StickyFooterPanel>
    </form>
  )
}

