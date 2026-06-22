import { HomeIcon } from '@/components/icons/home-icon';
import { Routes } from '@/config/routes';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const VisitStore = () => {
  const { t } = useTranslation();
  const { pathname, query } = useRouter();
  // When on a specific shop page, build a shops/<slug> path; otherwise use empty string for home
  const rawSlug =
    pathname === '/[shop]' && query?.shop ? `shops/${query.shop}` : '';
  // Normalize to avoid leading slashes; Routes.visitStore handles base URL + '/'
  const slug =
    typeof rawSlug === 'string' ? rawSlug.replace(/^\/+/, '') : '';

  return (
    <>
      <Link
        href={Routes.visitStore(slug as string)}
        target="_blank"
        className="inline-flex h-9 flex-shrink-0 items-center justify-center gap-2 rounded-md border border-border-base bg-gray-50 px-3.5 py-0 text-sm font-semibold leading-none text-accent outline-none transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-light focus-visible:ring-2 focus-visible:ring-accent-300 focus:outline-none"
        rel="noreferrer"
      >
        <HomeIcon />
        {!slug ? t('text-visit-site') : t('text-visit-store')}
      </Link>
    </>
  );
};

export default VisitStore;
