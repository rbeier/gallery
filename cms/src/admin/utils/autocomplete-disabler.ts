export function initAutocompleteDisabler() {
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
