import type { AppProps } from 'next/app';
import localFont from 'next/font/local';
import 'react-toastify/dist/ReactToastify.css';
import '@/assets/css/main.css';
import { UIProvider } from '@/contexts/ui.context';
import { SettingsProvider } from '@/contexts/settings.context';
import ErrorMessage from '@/components/ui/error-message';
import PageLoader from '@/components/ui/page-loader/page-loader';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';
import { useSettingsQuery } from '@/data/settings';
import { ReactQueryDevtools } from 'react-query/devtools';
import { appWithTranslation } from 'next-i18next';
import { ModalProvider } from '@/components/ui/modal/modal.context';
import DefaultSeo from '@/components/ui/default-seo';
import ManagedModal from '@/components/ui/modal/managed-modal';
import { CartProvider } from '@/contexts/quick-cart/cart.context';
import { useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import { useRouter } from 'next/router';
import PrivateRoute from '@/utils/private-route';
import { Config } from '@/config';
import axios from 'axios';

const inter = localFont({
  src: [
    {
      path: '../assets/fonts/inter/inter-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/inter/inter-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/inter/inter-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/inter/inter-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

const Noop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429 || (status >= 400 && status < 500)) {
      return false;
    }
  }

  return failureCount < 2;
};

const AppSettings: React.FC<{ children?: React.ReactNode }> = (props) => {
  const { locale } = useRouter();
  const language = locale || Config.defaultLanguage;
  const { settings, loading, error } = useSettingsQuery({ language });
  if (loading) return <PageLoader />;
  if (error) return <ErrorMessage message={error.message} />;
  // TODO: fix it
  // @ts-ignore
  return <SettingsProvider initialValue={settings?.options} {...props} />;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
const CustomApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const Layout = (Component as any).Layout || Noop;
  const authProps = (Component as any).authenticate;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: shouldRetryQuery,
          },
        },
      })
  );
  const getLayout = Component.getLayout ?? ((page) => page);

  const { locale } = useRouter();
  const dir = Config.getDirection(locale || Config.defaultLanguage);
  return (
    <div dir={dir} className={inter.className}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps?.dehydratedState}>
          <AppSettings>
            <UIProvider>
              <ModalProvider>
                <>
                  <CartProvider>
                    <DefaultSeo />
                    {authProps ? (
                      <PrivateRoute authProps={authProps}>
                        <Layout {...pageProps}>
                          <Component {...pageProps} />
                        </Layout>
                      </PrivateRoute>
                    ) : (
                      <Layout {...pageProps}>
                        <Component {...pageProps} />
                      </Layout>
                    )}
                    <ToastContainer
                      autoClose={2000}
                      theme="colored"
                      position="top-right"
                      toastClassName="!rounded-lg !shadow-md"
                    />
                    <ManagedModal />
                  </CartProvider>
                </>
              </ModalProvider>
            </UIProvider>
          </AppSettings>
          <ReactQueryDevtools />
        </Hydrate>
      </QueryClientProvider>
    </div>
  );
};

export default appWithTranslation(CustomApp);
