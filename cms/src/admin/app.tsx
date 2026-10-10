import type { StrapiApp } from '@strapi/strapi/admin'
import { ExternalLink } from '@strapi/icons'
import { GermanDateInput } from './components/german-date-input'
import { initAutocompleteDisabler } from './utils/autocomplete-disabler'
import { ViewLiveAction } from './actions/view-live-action'
import { CreatePhotoAction, CreatePhotoButton } from './actions/create-photo-action'

export default {
  config: {
    locales: ['de'],
    translations: {
      de: {
        'app.components.LeftMenu.frontend': 'Zur Website',
        'content-manager.actions.view-live': 'Auf Website ansehen',
        'content-manager.actions.create-photo': 'Neues Foto erstellen',
      },
      en: {
        'app.components.LeftMenu.frontend': 'Website',
        'content-manager.actions.view-live': 'View on website',
        'content-manager.actions.create-photo': 'Create new photo',
      },
    },
  },
  register(app: StrapiApp) {
    app.addFields({
      type: 'date',
      Component: GermanDateInput,
    })

    app.registerHook(
      'Admin/CM/pages/EditView/mutate-edit-view-layout',
      ({ layout, query }: { layout: any; query: any }) => {
        const disableAutocompleteOnField = (field: any) => {
          if (
            field?.name === 'lens' ||
            field?.name === 'location' ||
            field?.type === 'relation' ||
            field?.attribute?.type === 'relation'
          ) {
            return {
              ...field,
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: false,
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
            }
          }
          return field
        }

        if (layout?.layout && Array.isArray(layout.layout)) {
          layout.layout = layout.layout.map((panel: any) =>
            Array.isArray(panel)
              ? panel.map((row: any) =>
                  Array.isArray(row) ? row.map(disableAutocompleteOnField) : row
                )
              : panel
          )
        }

        if (layout?.components && typeof layout.components === 'object') {
          for (const key of Object.keys(layout.components)) {
            const comp = layout.components[key]
            if (comp?.layout && Array.isArray(comp.layout)) {
              comp.layout = comp.layout.map((row: any) =>
                Array.isArray(row) ? row.map(disableAutocompleteOnField) : row
              )
            }
          }
        }

        return { layout, query }
      }
    )

    const isDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const frontendUrl = isDev ? 'http://localhost:4200' : 'https://rbeier.dev'

    app.addMenuLink({
      to: frontendUrl,
      icon: ExternalLink,
      intlLabel: {
        id: 'app.components.LeftMenu.frontend',
        defaultMessage: 'Website',
      },
      permissions: [],
      position: -1,
    })
  },
  bootstrap(app: StrapiApp) {
    initAutocompleteDisabler()

    const cm = app.getPlugin('content-manager')
    if (cm?.apis?.addDocumentAction) {
      cm.apis.addDocumentAction((actions: any[]) => {
        return [...actions, ViewLiveAction, CreatePhotoAction]
      })
    }

    if (cm?.injectComponent) {
      cm.injectComponent('editView', 'right-links', {
        name: 'create-photo-button',
        Component: CreatePhotoButton,
      })
    }
  },
}
