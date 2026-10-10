import * as React from 'react'
import { ExternalLink } from '@strapi/icons'
import { useIntl } from 'react-intl'
import { photoSlug } from '../../lib/slug'

export const ViewLiveAction = ({ model, document }: any) => {
  const { formatMessage } = useIntl()

  const isPhoto = model === 'api::photo.photo'
  const isAlbum = model === 'api::album.album'

  if (!isPhoto && !isAlbum) {
    return null
  }

  const isDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const baseUrl = isDev ? 'http://localhost:4200' : 'https://rbeier.dev'

  let targetUrl: string | null = null
  if (isPhoto && document?.id != null) {
    targetUrl = `${baseUrl}/photo/${photoSlug(document.id, document.title)}`
  } else if (isAlbum && document?.slug) {
    targetUrl = `${baseUrl}/albums/${document.slug}`
  }

  const handleOnClick = () => {
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return {
    icon: <ExternalLink />,
    label: formatMessage({
      id: 'content-manager.actions.view-live',
      defaultMessage: 'Auf Website ansehen',
    }),
    onClick: handleOnClick,
    disabled: !document || !targetUrl,
    position: 'panel',
    variant: 'secondary',
  }
}

ViewLiveAction.type = 'view-live'
ViewLiveAction.position = 'panel'
