import LegalContent from '@/components/legal/legal-content';
import { termsAndConditionsContent } from '@/data/legal/terms-and-conditions';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
export default function TermsAndConditionsPage() {
  const { t } = useTranslation();
  const translatedTitle = t('text-terms-and-conditions', {
    defaultValue: termsAndConditionsContent.title,
  });

  return (
    <LegalContent
      title={translatedTitle || termsAndConditionsContent.title}
      lastUpdated={termsAndConditionsContent.lastUpdated}
      content={termsAndConditionsContent.content}
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common'])),
  },
});
