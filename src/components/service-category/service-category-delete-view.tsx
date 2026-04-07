import ConfirmationCard from '@/components/common/confirmation-card'
import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context'
import { useDeleteServiceCategoryMutation } from '@/data/service-category'

const ServiceCategoryDeleteView = () => {
  const { mutate: deleteServiceCategory, isLoading: loading } =
    useDeleteServiceCategoryMutation()

  const { data } = useModalState()
  const { closeModal } = useModalAction()

  function handleDelete() {
    const id = typeof data === 'number' ? data : Number(data)
    deleteServiceCategory({
      id,
    })
    closeModal()
  }

  return (
    <ConfirmationCard
      onCancel={closeModal}
      onDelete={handleDelete}
      deleteBtnLoading={loading}
    />
  )
}

export default ServiceCategoryDeleteView
