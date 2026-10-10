import * as React from 'react'
import { Button } from '@strapi/design-system'
import { Plus } from '@strapi/icons'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'

export const CreatePhotoAction = ({ model, document }: any) => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()

  const isPhoto = model === 'api::photo.photo'

  if (!isPhoto || !document) {
    return null
  }

  const handleOnClick = () => {
    navigate('/content-manager/collection-types/api::photo.photo/create')
  }

  return {
    icon: <Plus />,
    label: formatMessage({
      id: 'content-manager.actions.create-photo',
      defaultMessage: 'Neues Foto erstellen',
    }),
    onClick: handleOnClick,
    position: 'header',
    variant: 'secondary',
  }
}

CreatePhotoAction.type = 'create-photo'
CreatePhotoAction.position = 'header'

export const CreatePhotoButton = ({ slug }: { slug?: string }) => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const location = useLocation()

  if (slug !== 'api::photo.photo') {
    return null
  }

  if (location.pathname.endsWith('/create')) {
    return null
  }

  const handleOnClick = () => {
    navigate('/content-manager/collection-types/api::photo.photo/create')
  }

  return (
    <Button
      fullWidth
      variant="secondary"
      startIcon={<Plus />}
      onClick={handleOnClick}
    >
      {formatMessage({
        id: 'content-manager.actions.create-photo',
        defaultMessage: 'Neues Foto erstellen',
      })}
    </Button>
  )
}
