import Button from '@/components/ui/button'
import { useModalAction } from '@/components/ui/modal/modal.context'
import type { NotificationAction } from '@/types'
import React, { useEffect, useState } from 'react'

type Props = {
  notificationAction?: NotificationAction | null
  entityName?: string
  className?: string
  size?: 'small' | 'medium' | 'big'
}

function buildCompletedAction(
  action: NotificationAction,
  triggeredAt?: string,
): NotificationAction {
  return {
    ...action,
    can_trigger: false,
    triggered_at: triggeredAt ?? action.triggered_at ?? new Date().toISOString(),
  }
}

export default function NotificationActionButton({
  notificationAction,
  entityName,
  className,
  size = 'small',
}: Props) {
  const { openModal } = useModalAction()
  const [actionState, setActionState] = useState<NotificationAction | null>(
    notificationAction ?? null,
  )

  useEffect(() => {
    setActionState(notificationAction ?? null)
  }, [notificationAction])

  if (!actionState) {
    return null
  }

  const label = actionState.label || 'Notify customers'
  const isDisabled = !actionState.can_trigger

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isDisabled) return
    openModal('TRIGGER_NOTIFICATION_ACTION', {
      notificationAction: actionState,
      entityName,
      onCompleted: (updated: NotificationAction) => {
        setActionState(updated)
      },
    })
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      disabled={isDisabled}
      onClick={handleClick}
      className={`h-8 whitespace-nowrap rounded px-2.5 text-xs font-medium leading-none ${
        className ?? ''
      }`}
    >
      {label}
    </Button>
  )
}

export { buildCompletedAction }
