/**
 * Optional Front/Back/Side chips for product featured + gallery images.
 * Values persist on Attachment.view_type.
 *
 * IMPORTANT: Do not auto-write gallery/image via useEffect defaults — that races
 * with Uploader remove and can restore a deleted image while Save still succeeds.
 * Apparel defaults are applied at submit time in form-utils instead.
 */
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { Attachment } from '@/types';

const VIEW_OPTIONS = [
  { value: 'front', labelKey: 'form:view-type-front' },
  { value: 'back', labelKey: 'form:view-type-back' },
  { value: 'left', labelKey: 'form:view-type-side' },
  { value: 'detail', labelKey: 'form:view-type-detail' },
  { value: 'other', labelKey: 'form:view-type-other' },
] as const;

const APPAREL_RE =
  /apparel|cloth|shirt|dress|top|kurta|jean|trouser|jacket|hoodie|saree|fashion|tee|t-shirt|tshirt|clothing|garment/i;

export function isApparelProductContext(type?: any, categories?: any[]): boolean {
  const typeText = [type?.name, type?.slug].filter(Boolean).join(' ');
  if (APPAREL_RE.test(typeText)) return true;
  const cats = Array.isArray(categories) ? categories : [];
  return cats.some((c) =>
    APPAREL_RE.test([c?.name, c?.slug].filter(Boolean).join(' ')),
  );
}

/** Suggested default when vendor has not tagged yet (display + submit helper). */
export function suggestedViewType(
  kind: 'featured' | 'gallery',
  index: number,
  current?: string | null,
): string | undefined {
  if (current) return current;
  if (kind === 'featured') return 'front';
  if (kind === 'gallery' && index === 0) return 'back';
  return undefined;
}

function thumbUrl(item: Attachment | null | undefined): string {
  if (!item) return '';
  return item.thumbnail || item.original || '';
}

type Props = {
  /** When false, still allow tags if images already have view_type; otherwise hide. */
  forceShow?: boolean;
};

export default function ProductImageViewTags({ forceShow }: Props) {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext();
  const type = watch('type');
  const categories = watch('categories');
  const image = watch('image');
  const gallery = watch('gallery');

  const apparel = isApparelProductContext(type, categories);
  const show =
    forceShow ||
    apparel ||
    Boolean(image?.view_type) ||
    (Array.isArray(gallery) && gallery.some((g: Attachment) => g?.view_type));

  const featured: Attachment | null = Array.isArray(image)
    ? image[0] ?? null
    : image && image.original
      ? image
      : null;
  const galleryItems: Attachment[] = Array.isArray(gallery)
    ? gallery.filter((g) => g?.original)
    : [];

  if (!show || (!featured && galleryItems.length === 0)) {
    return null;
  }

  const setFeaturedView = (view_type: string) => {
    if (!featured) return;
    // Always patch from latest watched value; never rebuild from a stale list.
    const next = { ...featured, view_type };
    setValue('image', Array.isArray(image) ? [next] : next, {
      shouldDirty: true,
    });
  };

  const setGalleryView = (index: number, view_type: string) => {
    const current = Array.isArray(gallery) ? gallery : galleryItems;
    if (!current[index]?.original) return;
    const next = current.map((g: Attachment, i: number) =>
      i === index ? { ...g, view_type } : g,
    );
    setValue('gallery', next, { shouldDirty: true });
  };

  const ChipRow = ({
    label,
    value,
    onChange,
    preview,
  }: {
    label: string;
    value?: string;
    onChange: (v: string) => void;
    preview?: string;
  }) => (
    <div className="flex flex-col gap-2 rounded border border-border-200 p-3 sm:flex-row sm:items-center">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={label}
          className="h-14 w-14 rounded object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold text-heading">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs',
                value === opt.value
                  ? 'border-accent bg-accent text-light'
                  : 'border-border-200 bg-light text-body hover:border-accent',
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const featuredDisplay = apparel
    ? suggestedViewType('featured', 0, featured?.view_type)
    : featured?.view_type;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-body">{t('form:view-type-help-apparel')}</p>
      {featured ? (
        <ChipRow
          label={t('form:featured-image-title')}
          value={featuredDisplay}
          preview={thumbUrl(featured)}
          onChange={setFeaturedView}
        />
      ) : null}
      {galleryItems.map((g, index) => (
        <ChipRow
          key={`${g.original}-${index}`}
          label={`${t('form:gallery-title')} ${index + 1}`}
          value={
            apparel
              ? suggestedViewType('gallery', index, g.view_type)
              : g.view_type
          }
          preview={thumbUrl(g)}
          onChange={(v) => setGalleryView(index, v)}
        />
      ))}
    </div>
  );
}
