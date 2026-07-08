import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import { ALBUMS, PHOTOGRAPHER } from './seed-data';
import { generateMeta, locationValue } from './seed-generate';

/** Read actions the public role needs so the Angular frontend can fetch data. */
const PUBLIC_ACTIONS = [
  'api::album.album.find',
  'api::album.album.findOne',
  'api::photo.photo.find',
  'api::photo.photo.findOne',
  'api::tag.tag.find',
  'api::tag.tag.findOne',
  'api::lens.lens.find',
  'api::lens.lens.findOne',
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

  // Generate all metadata up front so tags can be de-duplicated into their own
  // collection before photos reference them.
  const metas = files.map((_, i) => generateMeta(i));

  const tagIdByName = new Map<string, string>();
  for (const name of new Set(metas.flatMap((m) => m.tags))) {
    const tag = await strapi.documents('api::tag.tag').create({ data: { name } });
    tagIdByName.set(name, tag.documentId);
  }

  const lensIdByName = new Map<string, string>();
  for (const name of new Set(metas.map((m) => m.lens))) {
    const lens = await strapi.documents('api::lens.lens').create({ data: { name } });
    lensIdByName.set(name, lens.documentId);
  }

  // Default each album cover to the first image assigned to it; editors can
  // change the cover later in the admin.
  const coverBySlug = new Map<string, number>();

  for (let i = 0; i < files.length; i++) {
    const media = await uploadImage(strapi, path.join(imageDir!, files[i]));
    const meta = metas[i];
    const slug = albumSlugs[i % albumSlugs.length];
    if (!coverBySlug.has(slug)) coverBySlug.set(slug, media.id);
    await strapi.documents('api::photo.photo').create({
      data: {
        ...meta,
        location: locationValue(meta.location),
        lens: lensIdByName.get(meta.lens)!,
        tags: meta.tags.map((name) => tagIdByName.get(name)!),
        image: media.id,
        album: albumIdBySlug.get(slug),
      },
    });
  }

  for (const [slug, coverId] of coverBySlug) {
    await strapi.documents('api::album.album').update({
      documentId: albumIdBySlug.get(slug)!,
      data: { cover: coverId },
    });
  }

  strapi.log.info(`[seed] Done. Uploaded ${files.length} images.`);
}

/**
 * Give the Photo edit view a tidy layout instead of the default cramped one
 * (e.g. the description textarea squeezed next to a number field). Rows must
 * each sum to <= 12 columns. Idempotent — re-applied on every boot.
 */
async function tidyPhotoEditView(strapi: Core.Strapi) {
  const key = 'plugin_content_manager_configuration_content_types::api::photo.photo';
  const store = strapi.db.query('strapi::core-store');
  const entry = await store.findOne({ where: { key } });
  if (!entry) return;

  const config = JSON.parse(entry.value);
  config.layouts.edit = [
    [{ name: 'title', size: 12 }],
    [{ name: 'description', size: 12 }],
    [
      { name: 'lens', size: 6 },
      { name: 'date', size: 6 },
    ],
    [{ name: 'location', size: 12 }],
    [{ name: 'image', size: 12 }],
    [
      { name: 'album', size: 6 },
      { name: 'tags', size: 6 },
    ],
  ];
  await store.update({ where: { key }, data: { value: JSON.stringify(config) } });
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    await seedContent(strapi);
    try {
      await tidyPhotoEditView(strapi);
    } catch (err) {
      strapi.log.warn(`[layout] Could not set Photo edit view: ${err}`);
    }
  },
};
