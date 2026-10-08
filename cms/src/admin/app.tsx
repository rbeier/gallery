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

export default {
  config: {
    locales: ['de'],
    translations: {
      de: {
        'app.components.LeftMenu.frontend': 'Zur Website',
      },
      en: {
        'app.components.LeftMenu.frontend': 'Website',
      },
    },
  },
  register(app: StrapiApp) {
    app.addFields({
      type: 'date',
      Component: GermanDateInput,
    })

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
}
