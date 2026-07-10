'use strict'

/**
 * One-off: regenerate responsive image formats (thumbnail/small/medium/large/xlarge)
 * for every existing upload, so files uploaded before a breakpoint change pick up
 * the new sizes (e.g. the 2000px `xlarge` used by the photo viewer).
 *
 * Boots its own Strapi instance and reuses the upload plugin's own image pipeline,
 * so output matches what a fresh upload would produce. Whatever else has the
 * SQLite file open MUST be stopped first — two writers on one file will lock.
 *
 * Dev (full source checkout):
 *   node scripts/regenerate-formats.js
 *
 * Production (compiled image, e.g. after adding the `lqip` breakpoint). Run as a
 * one-off container with the live cms stopped so the DB is free:
 *   docker compose stop cms
 *   docker compose run --rm cms node scripts/regenerate-formats.js
 *   docker compose start cms
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createStrapi, compileStrapi } = require('@strapi/strapi')

/**
 * Boot a Strapi instance for the script.
 *
 * In the production image only the compiled `dist` is shipped (no `src`, no TS
 * compiler), so boot straight from it — the same path `strapi start` takes. In
 * a dev checkout `dist` may be absent or stale, so compile the TS sources first.
 */
async function boot() {
  const appDir = process.cwd()
  // Prefer compiling from source when it exists (dev checkout) so the run always
  // reflects the latest code — booting a possibly-stale `dist` silently drops
  // recent changes. The production image ships only `dist` (no `src`/compiler),
  // so fall back to booting straight from the prebuilt dist there.
  if (fs.existsSync(path.join(appDir, 'src', 'index.ts'))) {
    return createStrapi(await compileStrapi()).load()
  }
  return createStrapi({ appDir, distDir: path.join(appDir, 'dist') }).load()
}

/** Keep only the serializable fields Strapi persists for a format entry. */
function toFormatEntry(f) {
  return {
    name: f.name,
    hash: f.hash,
    ext: f.ext,
    mime: f.mime,
    path: f.path ?? null,
    width: f.width,
    height: f.height,
    size: f.size,
    sizeInBytes: f.sizeInBytes,
    url: f.url,
    // Inline LQIP blur placeholder (only present on the thumbnail entry).
    ...(f.placeholder ? { placeholder: f.placeholder } : {}),
  }
}

async function main() {
  const app = await boot()

  const imageManip = app.plugin('upload').service('image-manipulation')
  const provider = app.plugin('upload').service('provider')
  const query = app.db.query('plugin::upload.file')

  const publicDir = app.dirs?.static?.public ?? path.join(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, 'uploads')

  const files = await query.findMany({ where: {}, limit: -1 })
  let done = 0
  let skipped = 0
  let failed = 0

  for (const entry of files) {
    if (!entry.mime || !entry.mime.startsWith('image/')) {
      skipped++
      continue
    }

    const originalPath = path.join(uploadsDir, `${entry.hash}${entry.ext}`)
    if (!fs.existsSync(originalPath)) {
      console.warn(`  ! missing original on disk: ${entry.hash}${entry.ext} — skipped`)
      skipped++
      continue
    }

    const tmpWorkingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'regen-formats-'))
    const fileData = {
      name: entry.name,
      hash: entry.hash,
      ext: entry.ext,
      mime: entry.mime,
      width: entry.width,
      height: entry.height,
      path: null,
      filepath: originalPath,
      tmpWorkingDirectory,
      getStream: () => fs.createReadStream(originalPath),
    }

    try {
      if (!(await imageManip.isResizableImage(fileData))) {
        skipped++
        continue
      }

      const formats = {}

      const thumbnail = await imageManip.generateThumbnail(fileData)
      if (thumbnail) {
        await provider.upload(thumbnail)
        formats.thumbnail = toFormatEntry(thumbnail)
      }

      const responsive = await imageManip.generateResponsiveFormats(fileData)
      for (const format of responsive) {
        if (!format || !format.file) continue
        await provider.upload(format.file)
        formats[format.key] = toFormatEntry(format.file)
      }

      await query.update({ where: { id: entry.id }, data: { formats } })
      done++
      console.log(`  ✓ ${entry.name} → ${Object.keys(formats).sort().join(', ') || '(none)'}`)
    } catch (err) {
      failed++
      console.error(`  ✗ ${entry.name}:`, err.message)
    } finally {
      fs.rmSync(tmpWorkingDirectory, { recursive: true, force: true })
    }
  }

  console.log(`\nregenerated ${done}, skipped ${skipped}, failed ${failed} (of ${files.length})`)
  await app.destroy()
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
