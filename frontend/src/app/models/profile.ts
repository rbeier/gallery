/** Site-wide photographer profile, sourced from the CMS `global` single type. */
export interface Profile {
  name: string
  heading: string
  location: string
  bio: string
  /** Profile picture URL (smallest format), if set. */
  avatar?: string
  /** Responsive `srcset` for the avatar so retina picks a sharper source. */
  avatarSrcset?: string
}
