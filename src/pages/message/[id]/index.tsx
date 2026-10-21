import Layout from '@/components/layouts/admin';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';
import MessagePageIndex from '@/components/message/index';

export default function MessagePage() {
  return (
    <>
      <MessagePageIndex />
    </>
  );
}

MessagePage.authenticate = {
  permissions: adminOnly,
};

MessagePage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"id":"__gh"} }], fallback: false };
}
