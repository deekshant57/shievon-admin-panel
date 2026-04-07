import * as yup from 'yup'

export const serviceCategoryValidationSchema = yup.object({
  name: yup.string().required('form:error-name-required'),
  slug: yup.string().default(''),
  parent: yup.mixed().nullable().default(null),
  sort_order: yup
    .number()
    .transform((_, originalValue) =>
      originalValue === '' || originalValue == null
        ? 0
        : Number(originalValue),
    )
    .min(0)
    .default(0),
  is_active: yup.boolean().required().default(true),
})
