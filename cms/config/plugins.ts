import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      // Serve uploaded media with a long, immutable cache. Filenames carry a
      // hash and never mutate in place (a replaced file gets a new name), so a
      // 1-year immutable cache is safe. maxage is in milliseconds (koa-static).
      // Without this, uploads default to max-age=0 (effectively uncached).
      providerOptions: {
        localServer: {
          maxage: 31_536_000_000, // 1 year
          immutable: true,
        },
      },
      // Cap the largest generated format at 2000px so the public viewer never
      // serves the full-resolution original (protects against high-res theft).
      // Overrides Strapi's default breakpoints; `xlarge` is the addition.
      breakpoints: {
        xlarge: 2000,
        large: 1000,
        medium: 750,
        small: 500,
        thumbnail: 245,
        // Tiny placeholder for LQIP blur-up (~24px longest side, <1KB). The
        // frontend shows it blurred+upscaled until the full image loads.
        lqip: 24,
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },
});

export default config;
