import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import { file as fileUtils } from '@strapi/utils';
import sharp from 'sharp';

/**
 * AVIF encoder settings. quality 50 lands ~50% under JPEG q80 on photos while
 * staying visually close; effort 4 (sharp default) is the sweet spot — measured
 * effort 6/7 gave no meaningful size gain here for 3–4x the encode time, which
 * matters when regenerating every image on the VPS.
 */
const AVIF_OPTIONS: sharp.AvifOptions = { quality: 50, effort: 4 };

const THUMBNAIL_RESIZE = { width: 245, height: 156, fit: 'inside' } as const;

/** Fallback if the upload plugin's breakpoints config is somehow absent. */
const DEFAULT_BREAKPOINTS: Record<string, number> = { large: 1000, medium: 750, small: 500 };

/** Minimal shape of the file object the upload plugin hands to the image pipeline. */
interface PipelineFile {
  name: string;
  hash: string;
  path?: string | null;
  filepath?: string;
  width?: number | null;
  height?: number | null;
  tmpWorkingDirectory?: string;
  getStream: () => NodeJS.ReadableStream;
}

/** Swap any file extension in a display name for `.avif`. */
const toAvifName = (name: string): string => `${name.replace(/\.[^.]+$/, '')}.avif`;

/**
 * Resize `file` and encode the result as AVIF, returning the object shape the upload
 * provider expects (getStream + hash + ext, plus the metadata Strapi persists).
 */
async function encodeAvif(
  file: PipelineFile,
  resize: { width: number; height: number; fit: 'inside' },
  { name, hash }: { name: string; hash: string },
) {
  const filePath = file.tmpWorkingDirectory ? path.join(file.tmpWorkingDirectory, hash) : hash;
  // sharp accepts a path or a Buffer; fall back to buffering the stream when the
  // source isn't on disk. rotate() bakes EXIF orientation so derivatives aren't sideways.
  const input: string | Buffer = file.filepath ?? (await fileUtils.streamToBuffer(file.getStream()));
  const info = await sharp(input, { animated: true })
    .rotate()
    .resize(resize)
    .avif(AVIF_OPTIONS)
    .toFile(filePath);

  const { width, height, size } = info;
  const pageHeight = (info as sharp.OutputInfo & { pageHeight?: number }).pageHeight;
  return {
    name,
    hash,
    ext: '.avif',
    mime: 'image/avif',
    filepath: filePath,
    path: file.path ?? null,
    getStream: () => fs.createReadStream(filePath),
    width,
    height: pageHeight ?? height,
    size: size ? fileUtils.bytesToKbytes(size) : 0,
    sizeInBytes: size,
  };
}

/**
 * Encode the upload plugin's image derivatives (thumbnail + responsive breakpoints)
 * as AVIF. Strapi exposes no config to change the derivative output format, so we
 * swap the two generator methods on the `image-manipulation` service at register
 * time. This applies to new uploads and to `scripts/regenerate-formats.js` alike,
 * since both drive the same service.
 *
 * The stored original keeps its source format (it is never served publicly — the
 * viewer is capped at the `xlarge` derivative); only the served derivatives become
 * AVIF, so the frontend needs no change — it just receives `.avif` URLs.
 */
export function installAvifPipeline(strapi: Core.Strapi): void {
  const service = strapi.plugin('upload').service('image-manipulation');
  const getDimensions: (file: PipelineFile) => Promise<{ width: number | null; height: number | null }> =
    service.getDimensions;

  service.generateThumbnail = async (file: PipelineFile) => {
    if (
      file.width &&
      file.height &&
      (file.width > THUMBNAIL_RESIZE.width || file.height > THUMBNAIL_RESIZE.height)
    ) {
      return encodeAvif(file, THUMBNAIL_RESIZE, {
        name: `thumbnail_${toAvifName(file.name)}`,
        hash: `thumbnail_${file.hash}`,
      });
    }
    return null;
  };

  service.generateResponsiveFormats = async (file: PipelineFile) => {
    const settings = ((await strapi.plugin('upload').service('upload').getSettings()) ?? {}) as {
      responsiveDimensions?: boolean;
    };
    if (!settings.responsiveDimensions) return [];

    const { width, height } = await getDimensions(file);
    const breakpoints = strapi.config.get<Record<string, number>>(
      'plugin::upload.breakpoints',
      DEFAULT_BREAKPOINTS,
    );

    const results: { key: string; file: unknown }[] = [];
    for (const key of Object.keys(breakpoints)) {
      const breakpoint = breakpoints[key];
      if (breakpoint < (width ?? 0) || breakpoint < (height ?? 0)) {
        results.push({
          key,
          file: await encodeAvif(
            file,
            { width: breakpoint, height: breakpoint, fit: 'inside' },
            { name: `${key}_${toAvifName(file.name)}`, hash: `${key}_${file.hash}` },
          ),
        });
      }
    }
    return results;
  };

  strapi.log.info('[avif] Upload image derivatives will be encoded as AVIF.');
}
