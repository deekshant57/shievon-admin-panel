import FormSection from '@/components/page/form-section'
import ActionButton from '@/components/ui/action-button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import SelectInput from '@/components/ui/select-input'
import StickyFooterPanel from '@/components/ui/sticky-footer-panel'
import SwitchInput from '@/components/ui/switch-input'
import {
  useCreateServiceCategoryMutation,
  useServiceCategoriesQuery,
  useUpdateServiceCategoryMutation,
} from '@/data/service-category'
import type { ServiceCategory } from '@/types'
import { formatSlug } from '@/utils/use-slug'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { serviceCategoryValidationSchema } from './service-category-validation-schema'

type FormValues = {
  name: string
  slug: string
  parent: ServiceCategory | null
  sort_order: number
  is_active: boolean
}

const defaultValues: FormValues = {
  name: '',
  slug: '',
  parent: null,
  sort_order: 0,
  is_active: true,
}

type IProps = {
  initialValues?: ServiceCategory
}

export default function ServiceCategoryForm({ initialValues }: IProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isSlugManual, setIsSlugManual] = useState(false)

  const { serviceCategories: parentOptions, loading: loadingParents } =
    useServiceCategoriesQuery({
      limit: 500,
      page: 1,
    })

  const parentChoices = useMemo(() => {
    const list = parentOptions ?? []
    if (!initialValues?.id) return list
    return list.filter((c) => c.id !== initialValues.id)
  }, [parentOptions, initialValues?.id])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          slug: initialValues.slug ?? '',
          parent: initialValues.parent ?? null,
          sort_order: initialValues.sortOrder ?? 0,
          is_active: initialValues.isActive ?? true,
        }
      : defaultValues,
    //@ts-expect-error yup schema output aligns with submit handler
    resolver: yupResolver(serviceCategoryValidationSchema),
  })

  const name = watch('name')
  const parent = watch('parent')

  useEffect(() => {
    if (isSlugManual) return
    const base =
      parent?.slug && name
        ? formatSlug(`${parent.slug}-${name}`)
        : formatSlug(name)
    setValue('slug', base || '')
  }, [name, parent?.slug, isSlugManual, setValue])

  const { mutate: createCategory, isLoading: creating } =
    useCreateServiceCategoryMutation()
  const { mutate: updateCategory, isLoading: updating } =
    useUpdateServiceCategoryMutation()

  const onSubmit = (values: FormValues) => {
    const parentId =
      values.parent?.id != null ? Number(values.parent.id) : null
    const hasExplicitSlug =
      typeof values.slug === 'string' && values.slug.trim().length > 0
    const resolvedSlug = hasExplicitSlug
      ? formatSlug(values.slug.trim())
      : formatSlug(values.name)

    const payload = {
      name: values.name.trim(),
      slug: resolvedSlug,
      parent_id: parentId,
      sort_order: Number(values.sort_order) || 0,
      is_active: values.is_active,
    }

    if (!initialValues?.id) {
      createCategory(payload)
    } else {
      updateCategory({
        id: initialValues.id,
        ...payload,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <FormSection
        title={t('form:form-title-information') || 'Details'}
        details={
          t('common:service-categories-form-help') ||
          'Set the name, slug, parent, and status for this service category'
        }
      >
        <Input
          label={t('form:input-label-name')}
          {...register('name')}
          error={t(errors.name?.message!)}
          variant="outline"
          className="mb-5"
          required
        />

        <div className="relative mb-5">
          <Input
            label={t('form:input-label-slug')}
            {...register('slug')}
            error={t(errors.slug?.message!)}
            variant="outline"
            onFocus={() => setIsSlugManual(true)}
          />
        </div>

        <div className="mb-5">
          <Label>{t('form:input-label-parent-category')}</Label>
          <SelectInput
            name="parent"
            control={control}
            getOptionLabel={(option: any) =>
              option?.slug
                ? `${option.name} (${option.slug})`
                : option.name
            }
            getOptionValue={(option: any) => String(option.id)}
            options={parentChoices}
            isClearable={true}
            isLoading={loadingParents}
          />
        </div>

        <Input
          label={t('form:input-label-sort-order')}
          type="number"
          {...register('sort_order')}
          error={t(errors.sort_order?.message!)}
          variant="outline"
          className="mb-5"
        />

        <SwitchInput
          name="is_active"
          control={control}
          label={t('common:text-active')}
        />
      </FormSection>

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
            loading={creating || updating}
            disabled={creating || updating}
            className="w-full sm:w-auto"
          >
            {initialValues
              ? t('form:button-label-update-service-category')
              : t('form:button-label-add-service-categories')}
          </ActionButton>
        </div>
      </StickyFooterPanel>
    </form>
  )
}
