/** Inputs for a page's document title + Open Graph / Twitter share metadata. */
export interface SeoMeta {
  title: string
  description: string
  /** Open Graph `og:type` (e.g. 'website', 'article'). Defaults to 'website'. */
  type?: string
  /**
   * Share image — an absolute URL or a media path (resolved to absolute).
   * When omitted, the service falls back to the latest photo in the gallery.
   */
  image?: string
  /** Alt text for the share image. Defaults to the title. */
  imageAlt?: string
}
