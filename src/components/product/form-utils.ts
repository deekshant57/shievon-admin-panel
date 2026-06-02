import {
  ProductType,
  Product,
  CreateProduct,
  Type,
  Author,
  Category,
  Tag,
  AttachmentInput,
  VariationOption,
  Variation,
  AttributeValue,
  ProductAttributeValueInput,
} from '@/types';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import sum from 'lodash/sum';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { omitTypename } from '@/utils/omit-typename';
import { cartesian } from '@/utils/cartesian';

export type ProductFormValues = Omit<
  CreateProduct,
  | 'author_id'
  | 'type_id'
  | 'manufacturer_id'
  | 'shop_id'
  | 'categories'
  | 'tags'
  | 'digital_file'
> & {
  type: Pick<Type, 'id' | 'name'>;
  product_type: ProductTypeOption;
  author: Pick<Author, 'id' | 'name'>;
  categories: Pick<Category, 'id' | 'name'>[];
  tags: Pick<Tag, 'id' | 'name'>[];
  digital_file_input: AttachmentInput;
  is_digital: boolean;
  slug: string;
  in_flash_sale: boolean;
  variations?: AttributeValue[];
  variation_options?: Variation[];
  // EAV product-level attributes keyed by definition code
  eav_attributes?: Record<string, ProductAttributeValueInput>;
  eav_attribute_template_codes?: string[];
  eav_variant_attribute_codes?: string[];
  eav_variant_dimensions?: Array<{ selectedOptions?: any[] }>;
  // image: AttachmentInput;
};

export type ProductTypeOption = {
  value: ProductType;
  name: string;
};

export const productTypeOptions: ProductTypeOption[] = Object.entries(
  ProductType,
).map(([key, value]) => ({
  name: key,
  value,
}));

export function getFormattedVariations(variations: any) {
  const variationGroup = groupBy(variations, 'attribute.slug');
  return Object.values(variationGroup)?.map((vg) => {
    return {
      attribute: vg?.[0]?.attribute,
      value: vg?.map((v) => ({ id: v.id, value: v.value })),
    };
  });
}

export function processOptions(options: any) {
  try {
    return JSON.parse(options);
  } catch (error) {
    return options;
  }
}

export function calculateMinMaxPrice(variationOptions: any) {
  if (!variationOptions || !variationOptions.length) {
    return {
      min_price: null,
      max_price: null,
    };
  }
  const sortedVariationsByPrice = orderBy(variationOptions, ['price']);
  const sortedVariationsBySalePrice = orderBy(variationOptions, ['sale_price']);
  return {
    min_price:
      sortedVariationsBySalePrice?.[0].sale_price <
      sortedVariationsByPrice?.[0]?.price
        ? sortedVariationsBySalePrice?.[0].sale_price
        : sortedVariationsByPrice?.[0]?.price,
    max_price:
      sortedVariationsByPrice?.[sortedVariationsByPrice?.length - 1]?.price,
  };
}

export function calculateQuantity(variationOptions: any) {
  return sum(
    variationOptions?.map(({ quantity }: { quantity: number }) => quantity),
  );
}

export function getProductDefaultValues(
  product: Product,
  isNewTranslation: boolean = false,
) {
  if (!product) {
    return {
      product_type: productTypeOptions[0],
      min_price: 0.0,
      max_price: 0.0,
      categories: [],
      tags: [],
      primary_category: null,
      secondary_category: null,
      tertiary_category: null,
      quaternary_category: null,
      in_stock: true,
      is_taxable: false,
      image: [],
      gallery: [],
      video: [],
      variations: [],
      variation_options: [],
    };
  }
  const {
    variations,
    variation_options,
    product_type,
    is_digital,
    digital_file,
  } = product;
  const productAny = product as any;

  // Normalize image: API may return single object or array; form/uploader accepts object or array
  const normalizedImage =
    product.image &&
    (product.image as any).thumbnail &&
    (product.image as any).original
      ? omitTypename(product.image as any)
      : [];
  // Normalize gallery: ensure array of { thumbnail, original }
  const normalizedGallery = Array.isArray(product.gallery)
    ? (product.gallery ?? []).map((g: any) => omitTypename(g))
    : product.gallery && (product.gallery as any).thumbnail
      ? [omitTypename(product.gallery as any)]
      : [];

  // Normalize categories: API may return full objects { id, name, slug } or just IDs
  const normalizedCategories = (product.categories ?? []).map((c: any) =>
    typeof c === 'object' && c !== null
      ? { id: c.id, name: c.name ?? c.slug ?? '' }
      : { id: c, name: '' },
  );
  const normalizedTags = (productAny.tags ?? []).map((t: any) =>
    typeof t === 'object' && t !== null
      ? { id: t.id, name: t.name ?? t.slug ?? '' }
      : { id: t, name: '' },
  );
  // Type must include slug for category cascader (useCategoriesQuery uses type?.slug)
  const normalizedType = product.type
    ? {
        id: product.type.id,
        name: (product.type as any).name ?? '',
        slug: (product.type as any).slug ?? (product.type as any).name ?? '',
      }
    : null;
  const normalizedAuthor = productAny.author
    ? {
        id: productAny.author.id,
        name: productAny.author.name ?? '',
      }
    : null;

  // Normalize video: form expects array of { url }
  const rawVideo = productAny.video;
  const normalizedVideo = Array.isArray(rawVideo)
    ? rawVideo.filter((v: any) => v?.url).map((v: any) => ({ url: v.url }))
    : rawVideo?.url
      ? [{ url: String(rawVideo.url) }]
      : [];

  const base: any = {
    ...product,
    product_type: productTypeOptions.find(
      (option) => product_type === option.value,
    ),
    image: normalizedImage,
    gallery: normalizedGallery,
    categories: normalizedCategories,
    tags: normalizedTags,
    type: normalizedType,
    author: normalizedAuthor,
    video: normalizedVideo,
    // Category cascader uses primary_category (and deeper levels); set leaf from first category so it pre-fills
    primary_category:
      normalizedCategories.length > 0 ? normalizedCategories[0] : null,
    secondary_category: null,
    tertiary_category: null,
    quaternary_category: null,
    ...(product_type === ProductType.Single && {
      ...(is_digital && {
        digital_file_input: {
          id: digital_file?.attachment_id,
          thumbnail: digital_file?.url,
          original: digital_file?.url,
          file_name: digital_file?.file_name,
        },
      }),
    }),

    ...(product_type === ProductType.Variable && {
      variations: getFormattedVariations(variations ?? []),
      variation_options: (variation_options ?? []).map(
        ({ image, gallery: optGallery, attributes: optAttrs, ...option }: any) => {
          // Map EAV attributes to form's options JSON (code + id for submit)
          const optionsJson =
            optAttrs?.length > 0
              ? JSON.stringify(
                  optAttrs.map((a: any) => ({
                    code: a.definition_code,
                    id: a.enum_value_id,
                  })),
                )
              : undefined;
          return {
            ...option,
            ...(!isEmpty(image) && { image: omitTypename(image) }),
            ...(Array.isArray(optGallery) &&
              optGallery.length > 0 && {
              gallery: optGallery.map((g: any) => omitTypename(g)),
            }),
            ...(optionsJson !== undefined && { options: optionsJson }),
            ...(option?.digital_file && {
              digital_file_input: {
                id: option?.digital_file?.attachment_id,
                file_name: option?.digital_file?.file_name,
              },
            }),
          };
        },
      ),
    }),

    // Remove initial dependent value for new translation
    ...(isNewTranslation && {
      type: null,
      categories: [],
      author_id: null,
      tags: [],
      author: [],
      variations: [],
      variation_options: [],
      digital_file: '',
      digital_file_input: {},
      ...(product_type === ProductType.Variable && {
        quantity: null,
      }),
    }),
  };

  // Map existing API EAV attributes (if present on product) into form-friendly shape
  const rawAttributes = (product as any)?.attributes;
  if (rawAttributes && typeof rawAttributes === 'object') {
    const eavAttributes: Record<string, ProductAttributeValueInput> = {};
    Object.entries(rawAttributes as Record<string, any>).forEach(
      ([code, attr]) => {
        if (!attr) return;
        const dataType = attr.data_type || attr.type;
        const value = attr.value;

        const payload: ProductAttributeValueInput = {
          definition_code: code,
        };

        if (dataType === 'enum' && value && typeof value === 'object' && value.id != null) {
          // Store the full option object { id, label } so react-select can display it
          payload.enum_value_id = value as any;
        } else if (dataType === 'enum' && value && typeof value !== 'object' && value !== '') {
          // Fallback: plain numeric ID
          payload.enum_value_id = Number(value);
        } else if (
          dataType === 'string' &&
          typeof value === 'string' &&
          value.trim() !== ''
        ) {
          payload.value_string = value;
        } else if (
          (dataType === 'number' || dataType === 'decimal') &&
          value !== undefined &&
          value !== null
        ) {
          const num = Number(value);
          if (!Number.isNaN(num)) {
            payload.value_number = num;
          } else {
            return;
          }
        } else if (dataType === 'boolean' && typeof value === 'boolean') {
          payload.value_boolean = value;
        } else {
          return;
        }

        eavAttributes[code] = payload;
      },
    );

    if (Object.keys(eavAttributes).length > 0) {
      base.eav_attributes = eavAttributes;
    }
  }

  return cloneDeep(base);
}

export function filterAttributes(attributes: any, variations: any) {
  let res = [];
  res = attributes?.filter((el: any) => {
    return !variations?.find((element: any) => {
      return element?.attribute?.slug === el?.slug;
    });
  });
  return res;
}

export function getCartesianProduct(values: any) {
  const formattedValues = values
    ?.map(
      (v: any) =>
        v?.value?.map((a: any) => ({
          name: v?.attribute?.name,
          value: a?.value,
          id: a?.id,
        })),
    )
    .filter((i: any) => i !== undefined);
  if (isEmpty(formattedValues)) return [];
  return cartesian(...formattedValues);
}

export function processFileWithName(file_input: any) {
  // Process Digital File Name section
  const splitArray = file_input?.original?.split('/');
  let fileSplitName = splitArray?.[splitArray?.length - 1]?.split('.');
  const fileType = fileSplitName?.pop(); // it will pop the last item from the fileSplitName arr which is the file ext
  const filename = fileSplitName?.join('.'); // it will join the array with dot, which restore the original filename

  return [
    {
      fileType: fileType,
      filename: filename,
    },
  ];
}

// Helper function to format image - remove id, only keep thumbnail and original
function formatImage(image: any): { thumbnail: string; original: string } | undefined {
  if (!image || !image.thumbnail || !image.original) {
    return undefined;
  }
  return {
    thumbnail: image.thumbnail,
    original: image.original,
  };
}

// Helper function to format gallery - remove id from each item, filter invalid items
function formatGallery(gallery: any[]): Array<{ thumbnail: string; original: string }> {
  if (!gallery || !Array.isArray(gallery)) {
    return [];
  }
  return gallery
    .filter((item) => item && item.thumbnail && item.original)
    .map((item) => ({
      thumbnail: item.thumbnail,
      original: item.original,
    }));
}

// Helper function to format digital file - only send id
function formatDigitalFile(digital_file_input: any): { id: string } | undefined {
  if (!digital_file_input || !digital_file_input.id) {
    return undefined;
  }
  return {
    id: digital_file_input.id,
  };
}

// Helper function to format video - filter out invalid entries, only keep url
function formatVideo(video: any[]): Array<{ url: string }> {
  if (!video || !Array.isArray(video)) {
    return [];
  }
  return video
    .filter((item) => item && item.url && item.url.trim() !== '')
    .map((item) => ({
      url: item.url,
    }));
}

/** Coerce form value to number for API. Handles string from input type="number". Returns undefined if invalid. */
function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Coerce to number; use 0 as fallback for quantity. */
function toQuantity(value: unknown): number {
  const n = toNumber(value);
  return n !== undefined ? Math.max(0, Math.floor(n)) : 0;
}

export function getProductInputValues(
  values: ProductFormValues,
  initialValues: any,
) {
  const {
    product_type,
    type,
    quantity,
    author,
    image,
    is_digital,
    categories,
    tags,
    eav_attributes,
    eav_attribute_template_codes,
    eav_variant_attribute_codes,
    digital_file_input,
    variation_options,
    variations,
    in_flash_sale,
    ...simpleValues
  } = values;
  
  // Format image - only include if valid (has thumbnail and original)
  const formattedImage = formatImage(image);
  
  // Format gallery - filter out invalid items
  const formattedGallery = formatGallery(values.gallery ?? []);
  
  // Format digital file - only send id when is_digital is true
  const formattedDigitalFile = is_digital ? formatDigitalFile(digital_file_input) : undefined;
  
  // Format video - filter out invalid entries
  const formattedVideo = formatVideo(values.video);
  
  // Base return object – categories are numbers for backend CreateProductDto; type_id is not sent
  const categoryIds =
    categories?.map((category) => Number(category?.id)).filter(
      (id) => !Number.isNaN(id),
    ) ?? [];

  // Base payload: categories are IDs only; type_id omitted per API spec
  const baseReturn: any = {
    ...simpleValues,
    is_digital,
    in_flash_sale,
    author_id: author?.id,
    product_type: product_type?.value,
    categories: categoryIds,
    tags:
      tags
        ?.map((tag) => Number(tag?.id))
        .filter((id) => !Number.isNaN(id)) || [],
    gallery: formattedGallery,
    video: formattedVideo,
  };

  // Map EAV product-level attributes into API payload
  const allowedAttributeCodes = Array.isArray(eav_attribute_template_codes)
    ? new Set(eav_attribute_template_codes)
    : null;
  const allowedVariantAttributeCodes = Array.isArray(eav_variant_attribute_codes)
    ? new Set(eav_variant_attribute_codes)
    : null;

  if (eav_attributes && typeof eav_attributes === 'object') {
    const attributesPayload: ProductAttributeValueInput[] = Object.entries(
      eav_attributes,
    )
      .filter(
        ([definition_code]) =>
          !allowedAttributeCodes || allowedAttributeCodes.has(definition_code),
      )
      .map(([definition_code, raw]) => {
        if (!raw) return null;

        const {
          enum_value_id,
          value_string,
          value_number,
          value_boolean,
        } = raw as any;

        // Skip if no value is set
        // enum_value_id may be a full option object { id, label, value } from react-select
        // or a plain number from initial form defaults. Normalise to numeric ID.
        const resolvedEnumId =
          enum_value_id != null && typeof enum_value_id === 'object'
            ? (enum_value_id as any)?.id
            : enum_value_id;
        const hasEnum = resolvedEnumId != null && resolvedEnumId !== '';
        const hasString =
          typeof value_string === 'string' && value_string.trim() !== '';
        const hasNumber =
          value_number !== undefined &&
          value_number !== null &&
          `${value_number}`.trim() !== '';
        const resolvedBoolean =
          value_boolean != null && typeof value_boolean === 'object'
            ? (value_boolean as any)?.value
            : value_boolean;
        const hasBoolean = typeof resolvedBoolean === 'boolean';

        if (!hasEnum && !hasString && !hasNumber && !hasBoolean) {
          return null;
        }

        const payload: ProductAttributeValueInput = {
          definition_code,
        };

        if (hasEnum) {
          payload.enum_value_id = Number(resolvedEnumId);
        } else if (hasString) {
          payload.value_string = value_string;
        } else if (hasNumber) {
          const parsed = Number(value_number);
          if (!Number.isNaN(parsed)) {
            payload.value_number = parsed;
          } else {
            return null;
          }
        } else if (hasBoolean) {
          payload.value_boolean = resolvedBoolean;
        }

        return payload;
      })
      .filter((item): item is ProductAttributeValueInput => item !== null);

    if (attributesPayload.length > 0) {
      baseReturn.attributes = attributesPayload;
    }
  }
  
  // Only include image if it's valid
  if (formattedImage) {
    baseReturn.image = formattedImage;
  }
  
  // Helper: format one variant for API (title, sku, price, quantity, is_disable, attributes, image, gallery).
  // On create: omit variant_id. On update: include variant_id (UUID) when updating existing variant.
  const formatVariantForApi = (option: any, isUpdateVariant: boolean = false) => {
    const parsedOptions = processOptions(option?.options) || [];
    const eavAttributes = parsedOptions
      .filter(
        (opt: any) =>
          opt &&
          typeof opt.code === 'string' &&
          opt.code &&
          opt.id !== undefined &&
          opt.id !== null &&
          (!allowedVariantAttributeCodes ||
            allowedVariantAttributeCodes.has(opt.code)),
      )
      .map((opt: any) => ({
        definition_code: opt.code as string,
        enum_value_id: Number(opt.id),
      })) as ProductAttributeValueInput[];

    const variantPrice = toNumber(option?.price);
    const variantSalePrice = toNumber(option?.sale_price);
    const variantQuantity = toQuantity(option?.quantity);
    const formatted: any = {
      title: option?.title ?? 'Variant',
      sku: option?.sku,
      price: variantPrice ?? 0,
      ...(variantSalePrice !== undefined && { sale_price: variantSalePrice }),
      quantity: variantQuantity,
      ...(option?.is_disable !== undefined && { is_disable: option.is_disable }),
      ...(eavAttributes.length > 0 && { attributes: eavAttributes }),
    };
    if (isUpdateVariant && option?.variant_id) {
      formatted.variant_id = String(option.variant_id);
    }
    const variationImage = formatImage(option?.image);
    if (variationImage) formatted.image = variationImage;
    const variationGallery = formatGallery(option?.gallery ?? []);
    if (variationGallery.length > 0) formatted.gallery = variationGallery;
    if (option?.is_digital && option?.digital_file_input?.id) {
      formatted.digital_file = { id: option.digital_file_input.id };
    }
    return formatted;
  };

  const getVariationDeleteIds = (): string[] =>
    initialValues?.variation_options
      ?.map((initialVariationOption: any) => {
        const initialVid = initialVariationOption?.variant_id ?? initialVariationOption?.id;
        const find = variation_options?.find(
          (variationOption: any) => {
            const vid = variationOption?.variant_id ?? variationOption?.id;
            return vid === initialVid;
          },
        );
        return find ? undefined : initialVid;
      })
      .filter((item: any) => item !== undefined && item !== null) ?? [];

  const isUpdate = Boolean(initialValues?.id);
  const isSimple = product_type?.value === ProductType?.Single;
  const isVariable = product_type?.value === ProductType?.Variable;

  // Simple: always send simple payload (sku, price, sale_price, quantity, attributes). Coerce numbers (form inputs often send strings).
  if (isSimple) {
    const simplePrice = toNumber(values.price);
    const simpleSalePrice = toNumber(values.sale_price);
    baseReturn.quantity = toQuantity(quantity);
    if (simplePrice !== undefined) baseReturn.price = simplePrice;
    else delete baseReturn.price;
    if (simpleSalePrice !== undefined) baseReturn.sale_price = simpleSalePrice;
    else delete baseReturn.sale_price;
    if (formattedDigitalFile) {
      baseReturn.digital_file = formattedDigitalFile;
    }
    delete baseReturn.variation_options;
  }

  // Variable: no root sku, price, sale_price; quantity = 0; send variation_options only
  if (isVariable) {
    delete baseReturn.sku;
    delete baseReturn.price;
    delete baseReturn.sale_price;
    baseReturn.quantity = 0;
    baseReturn.variation_options = {
      upsert:
        variation_options?.map((opt: any) =>
          formatVariantForApi(opt, isUpdate),
        ) ?? [],
      delete: getVariationDeleteIds(),
    };
  }

  return baseReturn;
}
