import type { StrapiApp } from '@strapi/strapi/admin'
import { ExternalLink } from '@strapi/icons'
import * as React from 'react'
import { DatePicker, Field, useComposedRefs } from '@strapi/design-system'
import { useIntl } from 'react-intl'
import { useField, useFocusInputField } from '@strapi/strapi/admin'

const MAX_DATE = new Date(2099, 11, 31)

const GermanDateInput = React.forwardRef<HTMLInputElement, any>(
  ({ name, required, label, hint, labelAction, type: _type, ...props }, ref) => {
    const { formatMessage } = useIntl()
    const field = useField(name)
    const fieldRef = useFocusInputField(name)
    const composedRefs = useComposedRefs(ref, fieldRef)
    const [lastValidDate, setLastValidDate] = React.useState<Date | null>(null)

    const value = typeof field.value === 'string' ? new Date(field.value) : undefined

    const handleDateChange = (date?: Date) => {
      if (!date) {
        field.onChange(name, null)
        setLastValidDate(null)
        return
      }
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      field.onChange(name, utcDate.toISOString().split('T')[0])
      setLastValidDate(utcDate)
    }

    return (
      <Field.Root error={field.error} name={name} hint={hint} required={required}>
        <Field.Label action={labelAction}>{label}</Field.Label>
        <DatePicker
          ref={composedRefs}
          locale="de-DE"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Löschen' })}
          onChange={handleDateChange}
          onClear={() => {
            field.onChange(name, null)
            setLastValidDate(null)
          }}
          onBlur={() => {
            if (field.value && !value) {
              field.onChange(
                name,
                lastValidDate ? lastValidDate.toISOString().split('T')[0] : null
              )
            }
          }}
          value={value}
          maxDate={MAX_DATE}
          {...props}
        />
        <Field.Hint />
        <Field.Error />
      </Field.Root>
    )
  }
)

function initAutocompleteDisabler() {
  if (typeof document === 'undefined') return

  const isTargetInput = (el: Element | null): el is HTMLInputElement => {
    if (!el || !(el instanceof HTMLInputElement)) return false
    const name = el.name || el.getAttribute('name') || ''
    const id = el.id || el.getAttribute('id') || ''
    const role = el.getAttribute('role') || ''
    const ariaAutocomplete = el.getAttribute('aria-autocomplete') || ''

    return (
      name === 'lens' ||
      name === 'location' ||
      id === 'lens' ||
      id === 'location' ||
      role === 'combobox' ||
      ariaAutocomplete === 'list'
    )
  }

  const disableAutocomplete = (input: HTMLInputElement) => {
    if (input.getAttribute('autocomplete') !== 'off') {
      input.setAttribute('autocomplete', 'off')
    }
    if (input.autocomplete !== 'off') {
      input.autocomplete = 'off'
    }
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('autocapitalize', 'off')
    input.setAttribute('spellcheck', 'false')
    input.setAttribute('data-lpignore', 'true')
    input.setAttribute('data-1p-ignore', 'true')
  }

  const applyToElementAndChildren = (root: Element | Document) => {
    if (isTargetInput(root as Element)) {
      disableAutocomplete(root as HTMLInputElement)
    }
    const matching = root.querySelectorAll<HTMLInputElement>(
      'input[name="lens"], input[name="location"], input#lens, input#location, input[role="combobox"], input[aria-autocomplete="list"]'
    )
    matching.forEach(disableAutocomplete)
  }

  const handleEvent = (e: Event) => {
    if (isTargetInput(e.target as Element)) {
      disableAutocomplete(e.target as HTMLInputElement)
    }
  }

  document.addEventListener('focusin', handleEvent, true)
  document.addEventListener('pointerdown', handleEvent, true)
  document.addEventListener('mousedown', handleEvent, true)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            applyToElementAndChildren(node)
          }
        })
      } else if (mutation.type === 'attributes' && isTargetInput(mutation.target as Element)) {
        disableAutocomplete(mutation.target as HTMLInputElement)
      }
    }
  })

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'id', 'role', 'autocomplete'],
    })
    applyToElementAndChildren(document)
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['name', 'id', 'role', 'autocomplete'],
      })
      applyToElementAndChildren(document)
    })
  }
}

const ViewLiveAction = ({ model, document }: any) => {
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
    targetUrl = `${baseUrl}/photo/${document.id}`
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

export default {
  config: {
    locales: ['de'],
    translations: {
      de: {
        'app.components.LeftMenu.frontend': 'Zur Website',
        'content-manager.actions.view-live': 'Auf Website ansehen',
      },
      en: {
        'app.components.LeftMenu.frontend': 'Website',
        'content-manager.actions.view-live': 'View on website',
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
        return [...actions, ViewLiveAction]
      })
    }
  },
}
