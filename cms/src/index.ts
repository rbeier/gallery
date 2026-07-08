import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import { ALBUMS, PHOTOGRAPHER } from './seed-data';
import { GRADIENTS, generateMeta } from './seed-generate';

/** Read actions the public role needs so the Angular frontend can fetch data. */
const PUBLIC_ACTIONS = [
  'api::album.album.find',
  'api::album.album.findOne',
  'api::photo.photo.find',
  'api::photo.photo.findOne',
  'api::global.global.find',
];

async function grantPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!publicRole) return;

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });
    if (!existing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } });
    }
  }
}

/** Locate the example images shipped alongside the repo. */
function findImageDir(): string | null {
  const candidates = [
    path.join(process.cwd(), '..', 'test-data'),
    path.join(process.cwd(), 'test-data'),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? null;
}

/** Upload a single file through the upload plugin; returns the media entity. */
async function uploadImage(strapi: Core.Strapi, filePath: string) {
  const stat = fs.statSync(filePath);
  const [file] = await strapi.plugins.upload.services.upload.upload({
    data: {},
    files: {
      filepath: filePath,
      originalFilename: path.basename(filePath),
      mimetype: 'image/jpeg',
      size: stat.size,
    },
  });
  return file;
}

async function seedContent(strapi: Core.Strapi) {
  const photoCount = await strapi.documents('api::photo.photo').count({});
  if (photoCount > 0) return;

  const imageDir = findImageDir();
  const files = imageDir
    ? fs
        .readdirSync(imageDir)
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
    : [];

  strapi.log.info(
    `[seed] Empty database — seeding ${ALBUMS.length} albums and ${files.length} photos.`,
  );

  await strapi.documents('api::global.global').create({
    data: { photographer: PHOTOGRAPHER },
  });

  const albumIdBySlug = new Map<string, string>();
  for (const album of ALBUMS) {
    const created = await strapi.documents('api::album.album').create({ data: album });
    albumIdBySlug.set(album.slug, created.documentId);
  }
  const albumSlugs = ALBUMS.map((a) => a.slug);

  for (let i = 0; i < files.length; i++) {
    const media = await uploadImage(strapi, path.join(imageDir!, files[i]));
    const meta = generateMeta(i);
    const ratio = media.width && media.height ? media.width / media.height : 1.5;
    await strapi.documents('api::photo.photo').create({
      data: {
        ...meta,
        tags: meta.tags.map((value) => ({ value })),
        ratio: Math.round(ratio * 100) / 100,
        grad: GRADIENTS[i % GRADIENTS.length],
        image: media.id,
        album: albumIdBySlug.get(albumSlugs[i % albumSlugs.length]),
      },
    });
  }

  strapi.log.info(`[seed] Done. Uploaded ${files.length} images.`);
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    await seedContent(strapi);
  },
};
