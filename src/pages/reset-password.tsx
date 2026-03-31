import Alert from '@/components/ui/alert'
import AuthPageLayout from '@/components/layouts/auth-layout'
import EnterNewPasswordView from '@/components/auth/forget-password/enter-new-password-view'
import PageLoader from '@/components/ui/page-loader/page-loader'
import { Routes } from '@/config/routes'
import {
  useResetPasswordMutation,
  useVerifyForgetPasswordTokenMutation,
} from '@/data/user'
import { getFormErrors } from '@/data/client/http-client'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

const getQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

export const getServerSideProps: GetServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
  },
})

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { mutate: verifyToken, isLoading: isVerifying } =
    useVerifyForgetPasswordTokenMutation()
  const { mutate: resetPassword, isLoading: isResetting } = useResetPasswordMutation()

  const [isTokenValid, setIsTokenValid] = useState(false)
  const [hasAttemptedVerify, setHasAttemptedVerify] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const rid = useMemo(() => getQueryValue(router.query.rid), [router.query.rid])
  const token = useMemo(() => getQueryValue(router.query.token), [router.query.token])
  const hasRequiredQuery = Boolean(rid && token)

  useEffect(() => {
    if (!router.isReady || hasAttemptedVerify) return

    if (!hasRequiredQuery) {
      setErrorMsg(t('form:text-invalid-reset-link-missing'))
      setHasAttemptedVerify(true)
      return
    }

    verifyToken(
      { rid, token },
      {
        onSuccess: (data) => {
          if (data?.success) {
            setIsTokenValid(true)
            setErrorMsg(null)
          } else {
            const message = data?.message || 'Reset token is invalid or expired'
            setErrorMsg(message)
            toast.error(message)
            setIsTokenValid(false)
          }
          setHasAttemptedVerify(true)
        },
        onError: (error: unknown) => {
          const message =
            getFormErrors(error) ||
            (error as Error)?.message ||
            'Reset token is invalid or expired'
          setErrorMsg(message)
          toast.error(message)
          setIsTokenValid(false)
          setHasAttemptedVerify(true)
        },
      }
    )
  }, [hasAttemptedVerify, hasRequiredQuery, rid, router.isReady, t, token, verifyToken])

  const handleReset = ({ password }: { password: string }) => {
    setErrorMsg(null)
    resetPassword(
      { rid, token, password },
      {
        onSuccess: (data) => {
          if (data?.success) {
            toast.success(data?.message || 'Password reset successfully')
            router.replace(Routes.login)
            return
          }
          const message = data?.message || 'Unable to reset password'
          setErrorMsg(message)
          toast.error(message)
        },
        onError: (error: unknown) => {
          const message =
            getFormErrors(error) || (error as Error)?.message || 'Unable to reset password'
          setErrorMsg(message)
          toast.error(message)
        },
      }
    )
  }

  return (
    <AuthPageLayout>
      <h3 className="mb-6 mt-4 text-center text-base italic text-body">
        {t('form:text-reset-password')}
      </h3>

      {errorMsg ? (
        <Alert
          variant="error"
          message={errorMsg}
          className="mb-6"
          closeable={true}
          onClose={() => setErrorMsg(null)}
        />
      ) : null}

      {!hasRequiredQuery ? (
        <p className="text-center text-sm text-body">
          {t('form:text-invalid-reset-link')}
        </p>
      ) : null}

      {hasRequiredQuery && !hasAttemptedVerify ? <PageLoader /> : null}

      {hasRequiredQuery && hasAttemptedVerify && isTokenValid ? (
        <EnterNewPasswordView loading={isResetting || isVerifying} onSubmit={handleReset} />
      ) : null}
    </AuthPageLayout>
  )
}
