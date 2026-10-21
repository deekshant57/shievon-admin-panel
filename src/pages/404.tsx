import LinkButton from '@/components/ui/link-button'
import { Routes } from '@/config/routes'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const NotFoundPage = () => {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded bg-white p-8 text-center shadow sm:p-10">
        <h1 className="text-3xl font-bold text-heading sm:text-4xl">
          {t('error-heading', { defaultValue: 'Error code: 404' })}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm text-body sm:text-base">
          {t('text-url-not-available', {
            defaultValue: 'The URL requested is not available.',
          })}
        </p>

        <div className="mt-8">
          <LinkButton href={Routes.dashboard}>
            {t('text-return-home', { defaultValue: 'Return to home' })}
          </LinkButton>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
})

export default NotFoundPage
