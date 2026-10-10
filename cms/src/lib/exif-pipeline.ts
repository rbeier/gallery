import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import { file as fileUtils } from '@strapi/utils';
import exifr from 'exifr';
import sharp from 'sharp';

export interface ExifMetadata {
  date: string | null; // 'YYYY-MM-DD'
  dateTimeOriginal: string | null; // ISO 8601 string
  make?: string | null;
  model?: string | null;
  lens?: string | null;
  focalLength?: number | null;
  fNumber?: number | null;
  iso?: number | null;
  exposureTime?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Formats a Date object to 'YYYY-MM-DD' in local camera day. */
export function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Extracts EXIF, XMP, IPTC and GPS metadata using exifr.
 * Accepts a file path or a Buffer.
 */
export async function extractExif(
  input: string | Buffer
): Promise<ExifMetadata | null> {
  try {
    const parsed = await exifr.parse(input, {
      tiff: true,
      xmp: true,
      iptc: true,
      exif: true,
      gps: true,
    });
    if (!parsed) return null;

    const rawDate = parsed.DateTimeOriginal || parsed.CreateDate || parsed.ModifyDate;
    let dateStr: string | null = null;
    let dateTimeOriginalStr: string | null = null;
    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      dateStr = formatDateOnly(rawDate);
      dateTimeOriginalStr = rawDate.toISOString();
    }

    return {
      date: dateStr,
      dateTimeOriginal: dateTimeOriginalStr,
      make: parsed.Make ?? null,
      model: parsed.Model ?? null,
      lens: parsed.LensModel ?? parsed.Lens ?? parsed.LensType ?? null,
      focalLength: parsed.FocalLength ?? null,
      fNumber: parsed.FNumber ?? null,
      iso: parsed.ISO ?? null,
      exposureTime: parsed.ExposureTime ?? null,
      latitude: parsed.latitude ?? null,
      longitude: parsed.longitude ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a lens entry matches the EXIF lens model string.
 * Supports exact match, alias list (comma / semicolon / newline separated),
 * and case-insensitive matching.
 */
export function matchesLens(lensExifModel: string | null | undefined, imageExifLens: string | null | undefined): boolean {
  if (!lensExifModel || !imageExifLens) return false;
  const target = imageExifLens.trim().toLowerCase();
  if (!target) return false;

  const candidates = lensExifModel
    .split(/[\n,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // 1. Exact match takes top priority
  if (candidates.some((candidate) => candidate === target)) {
    return true;
  }

  // 2. Substring matching (either candidate is contained in target or target contains candidate)
  return candidates.some(
    (candidate) => candidate.length >= 3 && (target.includes(candidate) || candidate.includes(target))
  );
}

/**
 * Searches the `api::lens.lens` collection for a lens whose `exifLensModel`
 * matches the given EXIF lens model string.
 */
export async function findMatchingLens(
  strapi: Core.Strapi,
  exifLens: string | null | undefined
): Promise<any | null> {
  if (!exifLens || typeof exifLens !== 'string' || !exifLens.trim()) {
    return null;
  }

  const lenses = await strapi.db.query('api::lens.lens').findMany();
  if (!Array.isArray(lenses) || lenses.length === 0) {
    return null;
  }

  // Pass 1: Try exact match first
  const exact = lenses.find((l: any) => {
    if (!l.exifLensModel) return false;
    const target = exifLens.trim().toLowerCase();
    const candidates = l.exifLensModel.split(/[\n,;]+/).map((s: string) => s.trim().toLowerCase());
    return candidates.includes(target);
  });
  if (exact) return exact;

  // Pass 2: Substring matching
  const partial = lenses.find((l: any) => {
    if (!l.exifLensModel) return false;
    return matchesLens(l.exifLensModel, exifLens);
  });
  return partial ?? null;
}

/**
 * Inspects a photo payload and if `date` or `lens` is missing, resolves the attached image
 * and populates them from the image's EXIF metadata.
 */
async function syncPhotoMetadataFromImage(
  strapi: Core.Strapi,
  photoData: Record<string, any>,
  isDocumentService = false
) {
  const isDateEmpty = !photoData.date;
  const isLensEmpty =
    !photoData.lens ||
    (typeof photoData.lens === 'object' && Array.isArray(photoData.lens.connect) && photoData.lens.connect.length === 0);

  if (!isDateEmpty && !isLensEmpty) {
    // Both already set manually; do not overwrite.
    return;
  }

  const imageRef = photoData.image;
  if (!imageRef) return;

  let imageId: number | null = null;
  let imageDocId: string | null = null;

  if (typeof imageRef === 'number') {
    imageId = imageRef;
  } else if (typeof imageRef === 'string') {
    if (/^\d+$/.test(imageRef)) {
      imageId = Number.parseInt(imageRef, 10);
    } else {
      imageDocId = imageRef;
    }
  } else if (typeof imageRef === 'object') {
    if (Array.isArray(imageRef) && imageRef.length > 0) {
      return syncPhotoMetadataFromImage(strapi, { ...photoData, image: imageRef[0] }, isDocumentService);
    }
    if (imageRef.connect && Array.isArray(imageRef.connect) && imageRef.connect.length > 0) {
      return syncPhotoMetadataFromImage(strapi, { ...photoData, image: imageRef.connect[0] }, isDocumentService);
    }
    if (imageRef.id) imageId = typeof imageRef.id === 'number' ? imageRef.id : Number.parseInt(imageRef.id, 10);
    if (imageRef.documentId) imageDocId = imageRef.documentId;
  }

  let file: any = null;
  if (imageId) {
    file = await strapi.db.query('plugin::upload.file').findOne({ where: { id: imageId } });
  } else if (imageDocId) {
    file = await strapi.db.query('plugin::upload.file').findOne({ where: { documentId: imageDocId } });
  }

  if (!file) return;

  // 1. Get cached or extracted EXIF
  let exif = file.provider_metadata?.exif ?? null;
  if (!exif && file.hash && file.ext) {
    const diskPath = path.join(strapi.dirs.static.public, 'uploads', `${file.hash}${file.ext}`);
    if (fs.existsSync(diskPath)) {
      exif = await extractExif(diskPath);
      if (exif) {
        await strapi.db.query('plugin::upload.file').update({
          where: { id: file.id },
          data: {
            provider_metadata: {
              ...(file.provider_metadata ?? {}),
              exif,
            },
          },
        });
      }
    }
  }

  // 2. Auto-fill Date if not set
  if (isDateEmpty && exif?.date) {
    photoData.date = exif.date;
    strapi.log.info(`[exif] Auto-populated photo date: ${exif.date} from image "${file.name}"`);
  }

  // 3. Auto-fill Lens if not set
  if (isLensEmpty && exif?.lens) {
    const matchedLens = await findMatchingLens(strapi, exif.lens);
    if (matchedLens) {
      if (isDocumentService) {
        photoData.lens = { set: [matchedLens.documentId] };
      } else {
        photoData.lens = matchedLens.id;
      }
      strapi.log.info(
        `[exif] Auto-populated photo lens: "${matchedLens.name}" (id: ${matchedLens.id}) matching EXIF lens "${exif.lens}"`
      );
    }
  }
}

/**
 * Installs the EXIF extraction and photo metadata auto-population pipeline in Strapi.
 */
export function installExifPipeline(strapi: Core.Strapi): void {
  const imageService = strapi.plugin('upload').service('image-manipulation');
  const origOptimize = imageService.optimize;
  const origGetDimensions = imageService.getDimensions;

  // 1. Ensure EXIF metadata is extracted and attached in getDimensions
  imageService.getDimensions = async (file: any) => {
    if (file && !file.provider_metadata?.exif) {
      try {
        const input: string | Buffer | null =
          file.filepath ?? (file.getStream ? await fileUtils.streamToBuffer(file.getStream()) : null);
        if (input) {
          const exif = await extractExif(input);
          if (exif) {
            file.provider_metadata = {
              ...(file.provider_metadata ?? {}),
              exif,
            };
          }
        }
      } catch (err) {
        strapi.log.warn(`[exif] Failed reading EXIF in getDimensions: ${err}`);
      }
    }
    return origGetDimensions(file);
  };

  // 2. Override optimize to:
  //    a) extract and store EXIF in provider_metadata
  //    b) call withMetadata() so Sharp does not strip EXIF from the stored file
  imageService.optimize = async (file: any) => {
    try {
      const input: string | Buffer | null =
        file.filepath ?? (file.getStream ? await fileUtils.streamToBuffer(file.getStream()) : null);
      if (input && !file.provider_metadata?.exif) {
        const exif = await extractExif(input);
        if (exif) {
          file.provider_metadata = {
            ...(file.provider_metadata ?? {}),
            exif,
          };
        }
      }

      const uploadSettings = ((await strapi.plugin('upload').service('upload').getSettings()) ?? {}) as {
        sizeOptimization?: boolean;
        autoOrientation?: boolean;
      };
      const { sizeOptimization = false, autoOrientation = false } = uploadSettings;

      if (input) {
        const metadata = await sharp(input).metadata();
        const format = metadata.format;
        const optimizableFormats = ['jpeg', 'png', 'webp', 'tiff'];

        if ((sizeOptimization || autoOrientation) && format && optimizableFormats.includes(format)) {
          let transformer = sharp(input, { animated: true }).withMetadata();

          if (format === 'jpeg') {
            transformer = transformer.jpeg({ quality: sizeOptimization ? 80 : 100 });
          } else if (format === 'png') {
            transformer = transformer.png({ quality: sizeOptimization ? 80 : 100 });
          } else if (format === 'webp') {
            transformer = transformer.webp({ quality: sizeOptimization ? 80 : 100 });
          } else if (format === 'tiff') {
            transformer = transformer.tiff({ quality: sizeOptimization ? 80 : 100 });
          }

          if (autoOrientation) {
            transformer = transformer.rotate();
          }

          const filePath = file.tmpWorkingDirectory
            ? path.join(file.tmpWorkingDirectory, `optimized-${file.hash}`)
            : `optimized-${file.hash}`;

          const newInfo = await transformer.toFile(filePath);
          const newFile = {
            ...file,
            filepath: filePath,
            getStream: () => fs.createReadStream(filePath),
            width: newInfo.width,
            height: newInfo.height,
            size: newInfo.size ? fileUtils.bytesToKbytes(newInfo.size) : 0,
            sizeInBytes: newInfo.size,
          };
          return newFile;
        }
      }
    } catch (err) {
      strapi.log.warn(`[exif] Custom optimize fallback to default optimize: ${err}`);
      return origOptimize(file);
    }

    return file;
  };

  // 3. Fallback database lifecycle on upload files to ensure provider_metadata is stored
  strapi.db.lifecycles.subscribe({
    models: ['plugin::upload.file'],
    async beforeCreate(event) {
      const data = event.params?.data;
      if (data && !data.provider_metadata?.exif && data.hash && data.ext) {
        const diskPath = path.join(strapi.dirs.static.public, 'uploads', `${data.hash}${data.ext}`);
        if (fs.existsSync(diskPath)) {
          const exif = await extractExif(diskPath);
          if (exif) {
            data.provider_metadata = {
              ...(data.provider_metadata ?? {}),
              exif,
            };
          }
        }
      }
    },
  });

  // 4. Database lifecycle on api::photo.photo to auto-fill date and lens
  strapi.db.lifecycles.subscribe({
    models: ['api::photo.photo'],
    async beforeCreate(event) {
      if (event.params?.data) {
        await syncPhotoMetadataFromImage(strapi, event.params.data, false);
      }
    },
    async beforeUpdate(event) {
      if (event.params?.data) {
        await syncPhotoMetadataFromImage(strapi, event.params.data, false);
      }
    },
  });

  // 5. Document service middleware on api::photo.photo (for Strapi 5 Content Manager)
  if (typeof (strapi as any).documents?.use === 'function') {
    (strapi as any).documents.use(async (context: any, next: () => Promise<any>) => {
      if (
        context.uid === 'api::photo.photo' &&
        (context.action === 'create' || context.action === 'update') &&
        context.params?.data
      ) {
        await syncPhotoMetadataFromImage(strapi, context.params.data, true);
      }
      return next();
    });
  }

  strapi.log.info('[exif] EXIF pipeline and Photo metadata auto-population installed.');
}
