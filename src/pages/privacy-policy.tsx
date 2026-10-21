import LegalContent from '@/components/legal/legal-content';
import { privacyPolicyContent } from '@/data/legal/privacy-policy';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const translatedTitle = t('text-privacy-policy', {
    defaultValue: privacyPolicyContent.title,
  });

  return (
    <LegalContent
      title={translatedTitle || privacyPolicyContent.title}
      lastUpdated={privacyPolicyContent.lastUpdated}
      content={privacyPolicyContent.content}
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
});
