import ConfirmationCard from '@/components/common/confirmation-card'
import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context'
import { useDeleteServiceOfferingMutation } from '@/data/service-offering'
import { getErrorMessage } from '@/utils/form-error'

const ServiceOfferingDeleteView = () => {
  const { mutate: deleteServiceOffering, isLoading: loading } =
    useDeleteServiceOfferingMutation()
  const { data } = useModalState()
  const { closeModal } = useModalAction()

  async function handleDelete() {
    try {
      deleteServiceOffering({ id: data })
      closeModal()
    } catch (error) {
      closeModal()
      getErrorMessage(error)
    }
  }

  return (
    <ConfirmationCard
      onCancel={closeModal}
      onDelete={handleDelete}
      deleteBtnLoading={loading}
    />
  )
}

export default ServiceOfferingDeleteView

