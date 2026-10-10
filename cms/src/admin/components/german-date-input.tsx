import * as React from 'react'
import { DatePicker, Field, useComposedRefs } from '@strapi/design-system'
import { useIntl } from 'react-intl'
import { useField, useFocusInputField, useForm, useFetchClient } from '@strapi/strapi/admin'

const MAX_DATE = new Date(2099, 11, 31)

/**
 * Formats a Date object as a German date string: 'DD.MM.YYYY' (UTC).
 */
export function formatGermanDate(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${d}.${m}.${y}`
}

/**
 * Formats a Date object as an ISO date string: 'YYYY-MM-DD' (UTC).
 */
export function dateToIso(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${y}-${m}-${d}`
}

/**
 * Parses German short dates and full dates:
 * - '09.10.' or '09.10' -> resolves to '09.10.YYYY' (adds current year)
 * - '0910' (4 digits)   -> resolves to '09.10.YYYY' (adds current year and punctuation)
 * - '9.10.' or '9.10'   -> resolves to '09.10.YYYY'
 * - '910' (3 digits)    -> resolves to '09.10.YYYY'
 * - '09.10.26'          -> resolves to '09.10.2026'
 * - '09.10.2026'        -> resolves to '09.10.2026'
 * - '091026' (6 digits) -> resolves to '09.10.2026'
 * - '09102026' (8 digits)-> resolves to '09.10.2026'
 *
 * Returns a UTC Date object if valid, or null if input cannot be parsed or is an invalid calendar day.
 */
export function parseGermanShortDate(raw: string, currentYear = new Date().getFullYear()): Date | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null

  let day: number
  let month: number
  let year: number = currentYear

  // Case 1: Dot-separated (e.g. '09.10.', '9.10.', '09.10', '9.10', '09.10.26', '09.10.2026')
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.?(?:(\d{2,4}))?$/)
  if (dotMatch) {
    day = Number.parseInt(dotMatch[1], 10)
    month = Number.parseInt(dotMatch[2], 10)
    if (dotMatch[3]) {
      const y = Number.parseInt(dotMatch[3], 10)
      year = dotMatch[3].length === 2 ? 2000 + y : y
    }
  } else {
    // Case 2: Pure digits without punctuation
    const digitsMatch = s.match(/^(\d{3,8})$/)
    if (!digitsMatch) return null
    const digits = digitsMatch[1]
    if (digits.length === 3) {
      // e.g. '910' -> 9.10
      day = Number.parseInt(digits.slice(0, 1), 10)
      month = Number.parseInt(digits.slice(1, 3), 10)
    } else if (digits.length === 4) {
      // e.g. '0910' -> 09.10
      day = Number.parseInt(digits.slice(0, 2), 10)
      month = Number.parseInt(digits.slice(2, 4), 10)
    } else if (digits.length === 6) {
      // e.g. '091026' -> 09.10.2026
      day = Number.parseInt(digits.slice(0, 2), 10)
      month = Number.parseInt(digits.slice(2, 4), 10)
      year = 2000 + Number.parseInt(digits.slice(4, 6), 10)
    } else if (digits.length === 8) {
      // e.g. '09102026' -> 09.10.2026
      day = Number.parseInt(digits.slice(0, 2), 10)
      month = Number.parseInt(digits.slice(2, 4), 10)
      year = Number.parseInt(digits.slice(4, 8), 10)
    } else {
      return null
    }
  }

  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  // Verify days in month (including leap year for February)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day > daysInMonth) return null

  return new Date(Date.UTC(year, month - 1, day))
}

export const GermanDateInput = React.forwardRef<HTMLInputElement, any>(
  ({ name, required, label, hint, labelAction, type: _type, ...props }, ref) => {
    const { formatMessage } = useIntl()
    const field = useField(name)
    const fieldRef = useFocusInputField(name)
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const composedRefs = useComposedRefs(ref, fieldRef, inputRef)

    const [lastValidDate, setLastValidDate] = React.useState<Date | null>(() =>
      typeof field.value === 'string' && field.value ? new Date(field.value) : null
    )

    const value = typeof field.value === 'string' && field.value ? new Date(field.value) : undefined

    const form = useForm('GermanDateInput', (state) => state?.values, false)
    const { get } = useFetchClient()
    const autoFilledImageIdRef = React.useRef<string | number | null>(null)

    React.useEffect(() => {
      if (typeof field.value === 'string' && field.value) {
        setLastValidDate(new Date(field.value))
      } else if (!field.value) {
        setLastValidDate(null)
      }
    }, [field.value])

    const autoFilledLensRef = React.useRef<boolean>(false)

    // Auto-fill date & lens from image EXIF if the user attaches/selects an image on the Photo resource
    React.useEffect(() => {
      const imageVal = (form as any)?.image
      if (!imageVal) {
        autoFilledImageIdRef.current = null
        autoFilledLensRef.current = false
        return
      }

      const asset = Array.isArray(imageVal) ? imageVal[0] : imageVal
      let imageId: number | string | null = null
      let directExifDate: string | null = null
      let directExifLens: string | null = null

      if (typeof asset === 'object' && asset !== null) {
        imageId = asset.id ?? asset.documentId ?? null
        directExifDate = asset.provider_metadata?.exif?.date ?? null
        directExifLens = asset.provider_metadata?.exif?.lens ?? null
      } else if (typeof asset === 'number' || typeof asset === 'string') {
        imageId = asset
      }

      if (!imageId || autoFilledImageIdRef.current === imageId) {
        return
      }

      const isDateEmpty = !field.value
      const wasDateAutoFilled = autoFilledImageIdRef.current !== null

      const applyExifDate = (exifDateStr: string) => {
        if (!isDateEmpty && !wasDateAutoFilled) return
        const parsed = new Date(exifDateStr)
        if (!Number.isNaN(parsed.getTime())) {
          autoFilledImageIdRef.current = imageId
          field.onChange(name, exifDateStr)
          setLastValidDate(parsed)
        }
      }

      const matchLensModel = (lensModel?: string | null, targetExif?: string | null) => {
        if (!lensModel || !targetExif) return false
        const target = targetExif.trim().toLowerCase()
        const candidates = lensModel
          .split(/[\n,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
        if (candidates.some((c) => c === target)) return true
        return candidates.some((c) => c.length >= 3 && (target.includes(c) || c.includes(target)))
      }

      const applyExifLens = (lensString: string) => {
        if (!lensString) return
        const currentLens = (form as any)?.lens
        const isLensEmpty =
          !currentLens ||
          (typeof currentLens === 'object' && Array.isArray(currentLens.connect) && currentLens.connect.length === 0)

        if (!isLensEmpty && !autoFilledLensRef.current) {
          return
        }

        get('/content-manager/collection-types/api::lens.lens?pageSize=100')
          .then((res: any) => {
            const lenses: any[] = res?.data?.results ?? res?.data?.data ?? []
            if (Array.isArray(lenses)) {
              const matched = lenses.find((l) => matchLensModel(l.exifLensModel, lensString))
              if (matched && (form as any)?.onChange) {
                const item = {
                  id: matched.id,
                  documentId: matched.documentId,
                  name: matched.name,
                  label: matched.name,
                  status: 'published',
                  apiData: {
                    id: matched.id,
                    documentId: matched.documentId,
                    locale: null,
                    isTemporary: true,
                  },
                }
                autoFilledLensRef.current = true
                ;(form as any).onChange('lens.connect', [item])
                ;(form as any).onChange('lens', { connect: [item] })
              }
            }
          })
          .catch(() => {
            // Ignore fetch errors
          })
      }

      if (directExifDate || directExifLens) {
        if (directExifDate) applyExifDate(directExifDate)
        if (directExifLens) applyExifLens(directExifLens)
      } else {
        let isCancelled = false
        get(`/upload/files/${imageId}`)
          .then((res: any) => {
            if (isCancelled) return
            const fetchedDate = res?.data?.provider_metadata?.exif?.date
            const fetchedLens = res?.data?.provider_metadata?.exif?.lens
            if (fetchedDate) applyExifDate(fetchedDate)
            if (fetchedLens) applyExifLens(fetchedLens)
          })
          .catch(() => {
            // Ignore fetch errors
          })
        return () => {
          isCancelled = true
        }
      }
    }, [form, field.value, get, name])

    const handleDateChange = (date?: Date) => {
      if (!date) {
        field.onChange(name, null)
        setLastValidDate(null)
        return
      }
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      field.onChange(name, dateToIso(utcDate))
      setLastValidDate(utcDate)
    }

    const applyParsedDate = (inputEl: HTMLInputElement) => {
      const raw = inputEl.value
      if (!raw || !raw.trim()) {
        field.onChange(name, null)
        setLastValidDate(null)
        return
      }

      const parsed = parseGermanShortDate(raw)
      if (parsed) {
        const iso = dateToIso(parsed)
        inputEl.value = formatGermanDate(parsed)
        field.onChange(name, iso)
        setLastValidDate(parsed)
        return
      }

      // Revert if invalid
      if (lastValidDate) {
        inputEl.value = formatGermanDate(lastValidDate)
        field.onChange(name, dateToIso(lastValidDate))
      } else if (value) {
        inputEl.value = formatGermanDate(value)
      } else {
        field.onChange(name, null)
      }
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
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            e.preventDefault()
            applyParsedDate(e.target)
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applyParsedDate(e.currentTarget)
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
