import { buildCompletedAction } from '@/components/notify-logs/notification-action-button'
import Button from '@/components/ui/button'
import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context'
import { useTriggerNotificationActionMutation } from '@/data/notify-logs'
import type { NotificationAction } from '@/types'
import { useTranslation } from 'next-i18next'

type ModalPayload = {
  notificationAction: NotificationAction
  entityName?: string
  onCompleted?: (updated: NotificationAction) => void
}

const NotificationTriggerConfirmationView = () => {
  const { t } = useTranslation('common')
  const { data } = useModalState() as { data?: ModalPayload }
  const { closeModal } = useModalAction()
  const { mutate: triggerNotification, isLoading } =
    useTriggerNotificationActionMutation()

  const action = data?.notificationAction
  const entityName = data?.entityName?.trim()

  const handleConfirm = () => {
    if (!action) {
      closeModal()
      return
    }

    triggerNotification(action, {
      onSuccess: (result) => {
        const triggeredAt =
          result.status === 'triggered'
            ? result.data.created_at
            : action.triggered_at ?? new Date().toISOString()
        const updated = buildCompletedAction(action, triggeredAt)
        data?.onCompleted?.(updated)
        closeModal()
      },
    })
  }

  const description = entityName
    ? t('text-notification-trigger-confirm-with-name', { name: entityName })
    : t('text-notification-trigger-confirm')

  return (
    <div className="m-auto w-full max-w-sm rounded-md bg-light p-4 pb-6 sm:w-[24rem] md:rounded-xl">
      <div className="h-full w-full text-center">
        <div className="flex h-full flex-col justify-between">
          <p className="mt-4 text-xl font-bold text-heading">
            {t('text-notification-trigger-title')}
          </p>
          <p className="px-6 py-2 leading-relaxed text-body-dark dark:text-muted">
            {description}
          </p>
          <div className="mt-8 flex w-full items-center justify-between space-s-4">
            <div className="w-1/2">
              <Button
                onClick={closeModal}
                loading={isLoading}
                disabled={isLoading}
                variant="custom"
                className="w-full rounded bg-accent py-2 px-4 text-center text-base font-semibold text-light shadow-md transition duration-200 ease-in hover:bg-accent-hover focus:bg-accent-hover focus:outline-none"
              >
                {t('button-cancel')}
              </Button>
            </div>
            <div className="w-1/2">
              <Button
                onClick={handleConfirm}
                loading={isLoading}
                disabled={isLoading}
                variant="custom"
                className="w-full rounded bg-accent py-2 px-4 text-center text-base font-semibold text-light shadow-md transition duration-200 ease-in hover:bg-accent-hover focus:bg-accent-hover focus:outline-none"
              >
                {action?.label || t('text-notification-trigger-confirm-button')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationTriggerConfirmationView
