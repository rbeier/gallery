/** Site-wide photographer profile, sourced from the CMS `global` single type. */
export interface Profile {
  name: string
  heading: string
  location: string
  bio: string
  /** Profile picture URL, if set. */
  avatar?: string
}
