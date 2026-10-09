import type { Core } from '@strapi/strapi';
import { photoSlug } from '../src/lib/slug';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  // Frontend origin the "Preview" button on an edit page links to. Defaults to
  // https://rbeier.dev in production, http://localhost:4200 in development.
  const rawClientUrl = env('CLIENT_URL');
  const clientUrl =
    rawClientUrl && rawClientUrl.trim() !== ''
      ? rawClientUrl
      : env('NODE_ENV') === 'production'
        ? 'https://rbeier.dev'
        : 'http://localhost:4200';

  return {
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
  // Content Preview: adds a "Preview" link on the edit page. Wired up for
  // photos and albums; other content types return null (no Preview button).
  // The handler only receives the documentId, so resolve the entry to read the
  // fields the frontend routes key off (photo → numeric id, album → slug).
  preview: {
    enabled: true,
    config: {
      allowedOrigins: Array.from(new Set([clientUrl, 'https://rbeier.dev', 'http://localhost:4200'])),
      async handler(uid, { documentId }) {
        if (uid === 'api::photo.photo') {
          const photo = await strapi.documents(uid).findOne({ documentId });
          return photo ? `${clientUrl}/photo/${photoSlug(photo.id, photo.title)}` : null;
        }
        if (uid === 'api::album.album') {
          const album = await strapi.documents(uid).findOne({ documentId });
          return album?.slug ? `${clientUrl}/albums/${album.slug}` : null;
        }
        return null;
      },
    },
  },
  };
};

export default config;
