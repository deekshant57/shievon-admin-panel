import Label from '@/components/ui/label'
import SelectInput from '@/components/ui/select-input'
import { useServiceCategoriesQuery } from '@/data/service-category'
import type { ServiceCategory } from '@/types'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useRef } from 'react'
import { Control, useWatch } from 'react-hook-form'

type Props = {
  control: Control<any>
  // react-hook-form's setValue has a generic signature; keep this loose for compatibility.
  setValue: any
  getValues: (name?: string) => any
}

function getParentId(item: any): number | null {
  const raw = item?.parentId ?? item?.parent_id ?? null
  if (raw == null) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

function getLevel(item: any): number | null {
  const raw = item?.level ?? null
  if (raw == null) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

function getTypeId(item: any): number | null {
  const raw = item?.typeId ?? item?.type_id ?? null
  if (raw == null) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

const EMPTY: any[] = []

export default function ServiceCategoryCascader({
  control,
  setValue,
  getValues,
}: Props) {
  const { t } = useTranslation('common')

  const type = useWatch({ control, name: 'type' })
  const typeId =
    type != null
      ? typeof type === 'object' && type.id != null
        ? Number(type.id)
        : Number(type)
      : undefined
  const hasGroup = typeId != null && !Number.isNaN(typeId)

  // Reset cascading selections when the group changes/clears
  useEffect(() => {
    if (!hasGroup) {
      setValue('service_category_id', null)
      setValue('service_primary_category', null)
      setValue('service_secondary_category', null)
      setValue('service_tertiary_category', null)
      setValue('service_quaternary_category', null)
      return
    }
    // on group change we also clear, so category selection stays consistent
    setValue('service_category_id', null)
    setValue('service_primary_category', null)
    setValue('service_secondary_category', null)
    setValue('service_tertiary_category', null)
    setValue('service_quaternary_category', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId])

  const { serviceCategories: rawCategories, loading } = useServiceCategoriesQuery(
    { limit: 999, page: 1 },
    { enabled: hasGroup },
  )
  const stableRaw = rawCategories ?? EMPTY

  // Optional forward-compat: if backend adds typeId/type_id, keep only matching ones.
  const all = useMemo(() => {
    if (!Array.isArray(stableRaw)) return EMPTY
    const filtered = (stableRaw as any[]).filter((c: any) => {
      const catTypeId = getTypeId(c)
      if (catTypeId == null) return true
      return hasGroup && catTypeId === typeId
    })
    return filtered
  }, [stableRaw, hasGroup, typeId])

  const primary = useWatch({
    control,
    name: 'service_primary_category',
  }) as ServiceCategory | null
  const secondary = useWatch({
    control,
    name: 'service_secondary_category',
  }) as ServiceCategory | null
  const tertiary = useWatch({
    control,
    name: 'service_tertiary_category',
  }) as ServiceCategory | null
  const quaternary = useWatch({
    control,
    name: 'service_quaternary_category',
  }) as ServiceCategory | null

  // Clear deeper levels when upper changes (mirror product cascader, but without form context)
  useEffect(() => {
    if (
      getValues('service_secondary_category') != null ||
      getValues('service_tertiary_category') != null ||
      getValues('service_quaternary_category') != null
    ) {
      setValue('service_secondary_category', null)
      setValue('service_tertiary_category', null)
      setValue('service_quaternary_category', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?.id])

  useEffect(() => {
    if (
      getValues('service_tertiary_category') != null ||
      getValues('service_quaternary_category') != null
    ) {
      setValue('service_tertiary_category', null)
      setValue('service_quaternary_category', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondary?.id])

  useEffect(() => {
    if (getValues('service_quaternary_category') != null) {
      setValue('service_quaternary_category', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertiary?.id])

  const allRef = useRef(all)
  allRef.current = all

  const primaryId = primary?.id != null ? Number(primary.id) : null
  const secondaryId = secondary?.id != null ? Number(secondary.id) : null
  const tertiaryId = tertiary?.id != null ? Number(tertiary.id) : null
  const quaternaryId = quaternary?.id != null ? Number(quaternary.id) : null

  useEffect(() => {
    const list = Array.isArray(allRef.current) ? allRef.current : []
    const hasLevel2Children =
      primaryId != null && list.some((c: any) => getParentId(c) === primaryId)
    const hasLevel3Children =
      secondaryId != null &&
      list.some((c: any) => getParentId(c) === secondaryId)
    const hasLevel4Children =
      tertiaryId != null && list.some((c: any) => getParentId(c) === tertiaryId)

    let isComplete = false
    if (primaryId != null && !hasLevel2Children) isComplete = true
    if (secondaryId != null && !hasLevel3Children) isComplete = true
    if (tertiaryId != null && !hasLevel4Children) isComplete = true
    if (quaternaryId != null) isComplete = true

    const leafId = quaternaryId ?? tertiaryId ?? secondaryId ?? primaryId
    const leaf = quaternary ?? tertiary ?? secondary ?? primary

    if (leaf && leafId != null && isComplete) {
      const current = getValues('service_category_id')
      if (Number(current) !== leafId) {
        setValue('service_category_id', leafId, { shouldValidate: true })
      }
    } else {
      const current = getValues('service_category_id')
      if (current != null) setValue('service_category_id', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, secondaryId, tertiaryId, quaternaryId])

  const getOptionLabel = (option: any) =>
    option?.slug ? `${option.name} (${option.slug})` : option.name
  const getOptionValue = (option: any) => option.id

  const level1Options = (all as any[]).filter((c: any) => {
    const parentId = getParentId(c)
    const lvl = getLevel(c)
    return lvl === 1 || parentId == null
  })
  const level2Options =
    primaryId != null
      ? (all as any[]).filter((c: any) => getParentId(c) === primaryId)
      : []
  const level3Options =
    secondaryId != null
      ? (all as any[]).filter((c: any) => getParentId(c) === secondaryId)
      : []
  const level4Options =
    tertiaryId != null
      ? (all as any[]).filter((c: any) => getParentId(c) === tertiaryId)
      : []

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-categories')}</Label>

      {!hasGroup ? (
        <p className="mt-1 text-sm text-body">{t('form:text-select-group-first')}</p>
      ) : (
        <>
          <SelectInput
            name="service_primary_category"
            control={control}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            // @ts-ignore
            options={level1Options}
            isLoading={loading}
            placeholder={t('form:text-select-category')}
          />

          {primary && level2Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="service_secondary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level2Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}

          {secondary && level3Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="service_tertiary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level3Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}

          {tertiary && level4Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="service_quaternary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level4Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

