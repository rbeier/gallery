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
      // Cap the largest generated format at 2000px so the public viewer never
      // serves the full-resolution original (protects against high-res theft).
      // Overrides Strapi's default breakpoints; `xlarge` is the addition.
      breakpoints: {
        xlarge: 2000,
        large: 1000,
        medium: 750,
        small: 500,
        thumbnail: 245,
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },
});

export default config;
