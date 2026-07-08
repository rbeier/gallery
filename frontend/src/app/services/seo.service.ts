import { Injectable, inject } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title)
  private readonly meta = inject(Meta)

  set(title: string, description: string, type = 'website'): void {
    this.title.setTitle(title)
    this.meta.updateTag({ name: 'description', content: description })
    this.meta.updateTag({ property: 'og:title', content: title })
    this.meta.updateTag({ property: 'og:description', content: description })
    this.meta.updateTag({ property: 'og:type', content: type })
  }
}
